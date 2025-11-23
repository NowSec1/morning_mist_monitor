import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Bell, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

interface NotificationManagerProps {
  locationId: number;
  locationName: string;
}

interface TestResult {
  success: boolean;
  error?: string;
  details?: string;
}

export default function NotificationManager({ locationId, locationName }: NotificationManagerProps) {
  const [open, setOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [formData, setFormData] = useState({
    type: "dingtalk" as "dingtalk" | "pushdeer",
    channelId: "",
    name: "",
    threshold: 80,
    frequency: "daily" as "daily" | "always",
    secret: "",
  });

  const utils = trpc.useUtils();

  // 获取通知配置
  const { data: configs, isLoading: configsLoading } = trpc.notifications.getConfigs.useQuery({
    locationId,
  });

  // 获取通知历史
  const { data: history, isLoading: historyLoading } = trpc.notifications.getHistory.useQuery({
    locationId,
    limit: 10,
  });

  // 添加通知配置
  const addConfigMutation = trpc.notifications.addConfig.useMutation({
    onSuccess: () => {
      toast.success("通知配置已添加");
      utils.notifications.getConfigs.invalidate();
      setOpen(false);
      setFormData({
        type: "dingtalk",
        channelId: "",
        name: "",
        threshold: 80,
        frequency: "daily",
        secret: "",
      });
      setTestResult(null);
    },
    onError: (error) => {
      toast.error(error.message || "添加配置失败");
    },
  });

  // 更新通知配置
  const updateConfigMutation = trpc.notifications.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("通知配置已更新");
      utils.notifications.getConfigs.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "更新配置失败");
    },
  });

  // 删除通知配置
  const deleteConfigMutation = trpc.notifications.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("通知配置已删除");
      utils.notifications.getConfigs.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除配置失败");
    },
  });

  // 手动触发通知（测试）
  const triggerMutation = trpc.notifications.triggerNotification.useMutation({
    onSuccess: (data: any) => {
      toast.success("测试通知已发送");
      utils.notifications.getHistory.invalidate();
      if (data && data.result) {
        setTestResult(data.result);
      }
    },
    onError: (error) => {
      toast.error(error.message || "发送通知失败");
    },
  });

  const handleAddConfig = async () => {
    if (!formData.channelId.trim()) {
      toast.error("请输入通知渠道标识");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("请输入通知名称");
      return;
    }

    addConfigMutation.mutate({
      locationId,
      type: formData.type,
      channelId: formData.channelId,
      name: formData.name,
      threshold: formData.threshold,
      frequency: formData.frequency,
      secret: formData.secret || undefined,
    });
  };

  const handleToggleConfig = (config: any) => {
    updateConfigMutation.mutate({
      configId: config.id,
      enabled: config.enabled ? 0 : 1,
    });
  };

  const handleDeleteConfig = (configId: number) => {
    if (window.confirm("确定要删除此通知配置吗？")) {
      deleteConfigMutation.mutate({ configId });
    }
  };

  const handleTestNotification = () => {
    setTestResult(null);
    triggerMutation.mutate({
      locationId,
      locationName,
      fogProbability: 85,
      sunriseTime: "06:30",
      blueHourStart: "06:00",
      blueHourEnd: "06:50",
      goldenHourStart: "06:20",
      goldenHourEnd: "07:30",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="configs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configs">通知配置</TabsTrigger>
          <TabsTrigger value="history">通知历史</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">通知渠道配置</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加通知
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>添加通知配置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>通知类型</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dingtalk">钉钉群机器人</SelectItem>
                        <SelectItem value="pushdeer">PushDeer推送</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.type === "dingtalk"
                        ? "请输入钉钉群机器人的Webhook URL"
                        : "请输入PushDeer的pushkey"}
                    </p>
                  </div>

                  <div>
                    <Label>通知渠道标识</Label>
                    <Input
                      placeholder={
                        formData.type === "dingtalk"
                          ? "https://oapi.dingtalk.com/robot/send?access_token=..."
                          : "PDU..."
                      }
                      value={formData.channelId}
                      onChange={(e) =>
                        setFormData({ ...formData, channelId: e.target.value })
                      }
                    />
                  </div>

                  {formData.type === "dingtalk" && (
                    <div>
                      <Label>加签Secret（可选）</Label>
                      <Input
                        type="password"
                        placeholder="如果启用了加签，请输入secret"
                        value={formData.secret}
                        onChange={(e) =>
                          setFormData({ ...formData, secret: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        钉钉群机器人安全设置中的加签secret，用于HMAC-SHA256签名认证
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>通知名称</Label>
                    <Input
                      placeholder="如：团队群、个人推送"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>晨雾概率阈值 (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          threshold: parseInt(e.target.value) || 80,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>通知频率</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">每天最多一次</SelectItem>
                        <SelectItem value="always">每次都通知</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {testResult && (
                    <Card className={`p-4 ${testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {testResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={testResult.success ? "text-green-800 font-semibold" : "text-red-800 font-semibold"}>
                            {testResult.success ? "测试成功" : "测试失败"}
                          </span>
                        </div>
                        {testResult.error && (
                          <p className={`text-sm ${testResult.success ? "text-green-700" : "text-red-700"}`}>
                            {testResult.error}
                          </p>
                        )}
                        {testResult.details && (
                          <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                            <p className="text-xs font-mono whitespace-pre-wrap break-words text-gray-700">
                              {testResult.details}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 gap-1"
                              onClick={() => copyToClipboard(testResult.details || "")}
                            >
                              <Copy className="w-3 h-3" />
                              复制错误信息
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleTestNotification}
                      disabled={triggerMutation.isPending || !formData.channelId}
                      variant="outline"
                      className="flex-1"
                    >
                      {triggerMutation.isPending ? "测试中..." : "测试配置"}
                    </Button>
                    <Button
                      onClick={handleAddConfig}
                      disabled={addConfigMutation.isPending}
                      className="flex-1"
                    >
                      {addConfigMutation.isPending ? "添加中..." : "添加配置"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {configsLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : configs && configs.length > 0 ? (
            <div className="space-y-2">
              {configs.map((config: any) => (
                <Card key={config.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{config.name}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {config.type === "dingtalk" ? "钉钉" : "PushDeer"}
                        </span>
                        {config.enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        阈值: {config.threshold}% | 频率: {config.frequency === "daily" ? "每天一次" : "每次通知"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {config.channelId}
                      </p>
                      {config.secret && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ 已配置加签认证
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={config.enabled ? "default" : "outline"}
                        onClick={() => handleToggleConfig(config)}
                      >
                        {config.enabled ? "启用" : "禁用"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>还没有配置任何通知</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">最近通知</h3>

          {historyLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((record: any) => (
                <Card key={record.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{record.message}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            record.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.status === "success" ? "成功" : "失败"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(record.createdAt).toLocaleString("zh-CN")}
                      </p>
                      {record.errorMessage && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                          <p className="text-xs font-mono whitespace-pre-wrap break-words text-gray-700">
                            {record.errorMessage}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-1 gap-1"
                            onClick={() => copyToClipboard(record.errorMessage)}
                          >
                            <Copy className="w-3 h-3" />
                            复制
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>还没有通知记录</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

