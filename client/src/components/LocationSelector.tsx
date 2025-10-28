import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { MapPin, Plus } from "lucide-react";

interface Location {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  altitude: number | string;
  timezone: string;
}

interface LocationSelectorProps {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationChange: (location: Location) => void;
}

export default function LocationSelector({
  locations,
  selectedLocation,
  onLocationChange,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGettingElevation, setIsGettingElevation] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    altitude: "0",
    timezone: "Asia/Shanghai",
  });

  const createLocationMutation = trpc.locations.create.useMutation();

  const handleGetElevation = async () => {
    if (!formData.latitude || !formData.longitude) {
      alert("请先填写经纬度");
      return;
    }

    setIsGettingElevation(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${formData.latitude}&longitude=${formData.longitude}`
      );
      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        altitude: Math.round(data.elevation[0]).toString(),
      }));
    } catch (error) {
      alert("获取海拔失败，请手动输入");
    } finally {
      setIsGettingElevation(false);
    }
  };

  const handleAddLocation = async () => {
    if (!formData.name || !formData.latitude || !formData.longitude) {
      alert("请填写所有必填字段");
      return;
    }

    try {
      await createLocationMutation.mutateAsync({
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        altitude: parseInt(formData.altitude),
        timezone: formData.timezone,
      });

      setFormData({
        name: "",
        latitude: "",
        longitude: "",
        altitude: "0",
        timezone: "Asia/Shanghai",
      });
      setIsOpen(false);

      // 重新获取地点列表
      window.location.reload();
    } catch (error) {
      alert("添加地点失败: " + (error instanceof Error ? error.message : "未知错误"));
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          监测地点
        </CardTitle>
        <CardDescription>选择或添加监测位置</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 地点列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {locations && locations.length > 0 ? (
            locations.map((location) => (
              <button
                key={location.id}
                onClick={() => onLocationChange(location)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedLocation?.id === location.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                <p className="font-semibold text-sm">{location.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {location.latitude}°, {location.longitude}°
                </p>
                {(typeof location.altitude === 'number' ? location.altitude : parseInt(location.altitude)) > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    海拔: {location.altitude}m
                  </p>
                )}
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              暂无地点，请添加
            </p>
          )}
        </div>

        {/* 添加地点按钮 */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加新地点
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>添加监测地点</DialogTitle>
              <DialogDescription>
                输入地点信息。坐标使用 WGS-84 坐标系。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">地点名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：高新-丈八一路"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">纬度 (°) *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="34.207012"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">经度 (°) *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="108.860019"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="altitude">海拔 (米)</Label>
                <div className="flex gap-2">
                  <Input
                    id="altitude"
                    type="number"
                    placeholder="0"
                    value={formData.altitude}
                    onChange={(e) =>
                      setFormData({ ...formData, altitude: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetElevation}
                    disabled={isGettingElevation || !formData.latitude || !formData.longitude}
                    className="whitespace-nowrap"
                    size="sm"
                  >
                    {isGettingElevation ? "获取中..." : "自动获取"}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="timezone">时区</Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <Button
                onClick={handleAddLocation}
                disabled={createLocationMutation.isPending}
                className="w-full"
              >
                {createLocationMutation.isPending ? "添加中..." : "添加地点"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

