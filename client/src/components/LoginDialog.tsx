import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";

export default function LoginDialog() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.loginLocal.useMutation();
  const registerMutation = trpc.auth.registerLocal.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        username: loginUsername,
        password: loginPassword,
      });

      if (result.success) {
        // 登录成功，刷新页面以更新用户状态
        window.location.reload();
      } else {
        setError(result.error || "登录失败");
      }
    } catch (err: any) {
      setError(err.message || "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerPassword !== registerConfirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const result = await registerMutation.mutateAsync({
        username: registerUsername,
        password: registerPassword,
        email: registerEmail || undefined,
        name: registerName || undefined,
      });

      if (result.success) {
        setError(null);
        // 注册成功后自动登录
        const loginResult = await loginMutation.mutateAsync({
          username: registerUsername,
          password: registerPassword,
        });

        if (loginResult.success) {
          window.location.reload();
        } else {
          setError("注册成功，请重新登录");
          setActiveTab("login");
          setLoginUsername(registerUsername);
          setLoginPassword(registerPassword);
        }
      } else {
        setError(result.error || "注册失败");
      }
    } catch (err: any) {
      setError(err.message || "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">晨雾监测系统</CardTitle>
          <CardDescription>选择登录方式</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">登录</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">注册</span>
              </TabsTrigger>
              <TabsTrigger value="sso">SSO</TabsTrigger>
            </TabsList>

            {/* 登录标签页 */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">用户名</label>
                  <Input
                    type="text"
                    placeholder="输入用户名"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">密码</label>
                  <Input
                    type="password"
                    placeholder="输入密码"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !loginUsername || !loginPassword}
                >
                  {loading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>

            {/* 注册标签页 */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">用户名</label>
                  <Input
                    type="text"
                    placeholder="输入用户名（3-64个字符）"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">邮箱（可选）</label>
                  <Input
                    type="email"
                    placeholder="输入邮箱地址"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">昵称（可选）</label>
                  <Input
                    type="text"
                    placeholder="输入昵称"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">密码</label>
                  <Input
                    type="password"
                    placeholder="输入密码（至少6个字符）"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">确认密码</label>
                  <Input
                    type="password"
                    placeholder="再次输入密码"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !registerUsername || !registerPassword || !registerConfirmPassword}
                >
                  {loading ? "注册中..." : "注册"}
                </Button>
              </form>
            </TabsContent>

            {/* SSO标签页 */}
            <TabsContent value="sso" className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                使用Manus账户登录
              </p>
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="w-full"
                variant="outline"
              >
                使用Manus SSO登录
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
