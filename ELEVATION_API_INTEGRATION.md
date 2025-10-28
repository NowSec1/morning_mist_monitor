# 海拔API集成方案

## 选择方案：Open-Meteo Elevation API

### 原因
1. **与现有系统集成**：已使用Open-Meteo Weather API，使用同一供应商可以简化集成
2. **免费且可靠**：完全免费，无需API密钥，全球覆盖
3. **高分辨率**：基于Copernicus DEM 2021，90米分辨率
4. **简单易用**：REST API，无复杂认证

### API文档

**端点：** `https://api.open-meteo.com/v1/elevation`

**请求参数：**
- `latitude` (必需)：纬度，浮点数，范围 -90 到 90
- `longitude` (必需)：经度，浮点数，范围 -180 到 180
- 支持批量查询：最多100个坐标，用逗号分隔

**响应格式：**
```json
{
  "elevation": [38.0]
}
```

**示例请求：**
```
https://api.open-meteo.com/v1/elevation?latitude=34.207012&longitude=108.860019
```

**响应示例：**
```json
{
  "elevation": [380.5]
}
```

### 集成实现

#### 1. 后端API路由（server/routers.ts）

添加新的路由用于获取海拔：

```typescript
const elevationRouter = router({
  // 获取指定坐标的海拔
  getElevation: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${input.latitude}&longitude=${input.longitude}`
        );
        const data = await response.json();
        return {
          elevation: data.elevation[0],
          latitude: input.latitude,
          longitude: input.longitude,
        };
      } catch (error) {
        throw new Error("无法获取海拔数据");
      }
    }),

  // 批量获取海拔
  getElevationBatch: publicProcedure
    .input(
      z.object({
        coordinates: z.array(
          z.object({
            latitude: z.number(),
            longitude: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const latitudes = input.coordinates.map((c) => c.latitude).join(",");
        const longitudes = input.coordinates.map((c) => c.longitude).join(",");

        const response = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
        );
        const data = await response.json();

        return input.coordinates.map((coord, index) => ({
          ...coord,
          elevation: data.elevation[index],
        }));
      } catch (error) {
        throw new Error("无法批量获取海拔数据");
      }
    }),
});
```

#### 2. 前端集成

在LocationSelector组件中添加自动获取海拔功能：

```typescript
const getElevationMutation = trpc.elevation.getElevation.useMutation();

const handleAddLocation = async () => {
  // ... 验证输入 ...

  try {
    // 获取海拔
    const elevationResult = await getElevationMutation.mutateAsync({
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    });

    // 使用获取的海拔或用户输入的值
    const altitude = elevationResult.elevation || parseInt(formData.altitude);

    // 创建地点
    await createLocationMutation.mutateAsync({
      name: formData.name,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      altitude: Math.round(altitude),
      timezone: formData.timezone,
    });
  } catch (error) {
    alert("获取海拔失败，请手动输入");
  }
};
```

### 云层数据优化

#### 当前状况
- Open-Meteo API 提供低、中、高三层云量覆盖率
- 分辨率：小时级数据
- 覆盖范围：全球

#### 优化方案

1. **海拔修正**（已在algorithms.ts中实现）
   - 每升高100米，低云层覆盖率降低约1-2%
   - 公式：`adjustedLowCloud = lowCloud - (altitude / 100) * 0.015`

2. **云层高度估算**
   - 低云层：0-2000米（层积云、层云、积云）
   - 中云层：2000-6000米（高层云、高积云）
   - 高云层：6000米以上（卷云、卷层云）
   - 根据海拔自动调整显示的云层高度范围

3. **数据精度提升**
   - 使用Copernicus DEM进行海拔修正
   - 结合温度递减率估算云底高度
   - 温度递减率：约6.5°C/1000m

### 实现步骤

1. ✅ 在routers.ts中添加elevation路由
2. ✅ 在LocationSelector中集成海拔获取
3. ✅ 更新FogPredictionDisplay以显示海拔修正后的云层数据
4. ✅ 在算法说明中补充海拔修正说明

### 注意事项

- Open-Meteo Elevation API 免费版本无请求限制
- 响应时间通常在100-200ms
- 可以缓存海拔数据以减少API调用
- 海拔修正的准确性取决于DEM数据的分辨率

### 替代方案

如果需要更高分辨率的云层数据，可以考虑：
1. **NOAA GFS数据**：美国国家气象局，更详细的大气数据
2. **Sentinel-5P**：欧空局卫星数据，高分辨率云层信息
3. **ECMWF ERA5**：欧洲中期天气预报中心，高精度数据
4. **Google Maps Elevation API**：更高精度，但需要付费

