import { useMemo, useRef, useState } from 'react';
import { Pencil, User, Mail, Phone, Calendar, Shield, Users, UserCog, Key, Briefcase } from 'lucide-react';
import ChangePasswordForm, {
  type ChangePasswordFormRef,
  type ChangePasswordValues,
} from '@/pages/account/components/ChangePasswordForm';
import ChangeEmailForm, {
  type ChangeEmailFormRef,
  type ChangeEmailValues,
} from '@/pages/account/components/ChangeEmailForm';
import { changePassword } from '@/api/user';
import { useAuth } from '@/context/AuthContext';
import heroBg from '@/assets/image/tps-693-320.png';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const AccountInfoPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'password' | 'email' | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const pwdRef = useRef<ChangePasswordFormRef>(null);
  const emailRef = useRef<ChangeEmailFormRef>(null);

  const { userProfile, loading } = useAuth();

  // 掩码工具
  const maskEmail = (email?: string) => {
    if (!email) return '-';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const visible = name.slice(0, Math.min(3, name.length));
    return `${visible}${name.length > 3 ? '***' : ''}@${domain}`;
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return '-';
    if (phone.length <= 7) return phone;
    return `${phone.slice(0, 3)}******${phone.slice(-2)}`;
  };

  const modalTitle = useMemo(() => {
    if (modalType === 'password') return '修改登录密码';
    if (modalType === 'email') return '修改安全邮箱';
    return '';
  }, [modalType]);

  const modalDescription = useMemo(() => {
    if (modalType === 'password') return '请输入当前密码和新密码以完成修改';
    if (modalType === 'email') return '请输入新邮箱地址并验证';
    return '';
  }, [modalType]);

  const handleOpen = (type: 'password' | 'email') => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleOk = () => {
    if (modalType === 'password') return pwdRef.current?.submit();
    if (modalType === 'email') return emailRef.current?.submit();
  };

  const handleSubmitPassword = async (values: ChangePasswordValues) => {
    setConfirmLoading(true);
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        newPassword2: values.confirmPassword,
      });
      toast.success('密码修改成功');
      setModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || '密码修改失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSendEmailCode = async (email: string) => {
    // TODO: 调接口发送验证码
    console.log('send email code to', email);
    toast.success('验证码已发送');
  };

  const handleSubmitEmail = async (values: ChangeEmailValues) => {
    setConfirmLoading(true);
    try {
      // TODO: 调接口提交修改邮箱
      console.log('submit email', values);
      toast.success('邮箱修改成功');
      setModalOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="w-full p-6 space-y-6 pb-20">
      {/* 页面标题 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">账户信息</h1>
        <p className="text-muted-foreground">管理您的个人信息和账户设置</p>
      </div>

      {/* 个人信息卡片 */}
      <Card className="py-0 from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_280px] items-center">
            <div className="flex items-center gap-6 p-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src="" alt={userProfile?.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                  {getInitials(userProfile?.name || userProfile?.account)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {loading ? '加载中...' : userProfile?.name || userProfile?.account || '未登录'}
                  </h2>
                  {userProfile?.type === '1' && (
                    <Badge variant="default" className="gap-1">
                      <Shield className="h-3 w-3" />
                      管理员
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {userProfile?.email || userProfile?.account || '请登录'}
                </p>
              </div>
            </div>
            <div 
              className="h-30 bg-cover bg-center bg-no-repeat" 
              style={{ backgroundImage: `url(${heroBg})` }}
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>

      {/* 账号信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            我的账号
          </CardTitle>
          <CardDescription>查看和管理您的账号基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 登录名 */}
            <div className="flex items-center py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Mail className="h-4 w-4" />
                登录名
              </label>
              <p className="text-sm font-medium">
                {maskEmail(userProfile?.account || userProfile?.email)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 ml-1"
                onClick={() => handleOpen('email')}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 账号ID */}
            <div className="flex items-center gap-4 py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Key className="h-4 w-4" />
                账号ID
              </label>
              <p className="text-sm font-medium flex-1">-</p>
            </div>

            {/* 显示名称 */}
            <div className="flex items-center gap-4 py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <User className="h-4 w-4" />
                显示名称
              </label>
              <p className="text-sm font-medium flex-1">{userProfile?.name || '-'}</p>
            </div>

            {/* 登录密码 */}
            <div className="flex items-center py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Shield className="h-4 w-4" />
                登录密码
              </label>
              <p className="text-sm font-medium">已设置</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 ml-1"
                onClick={() => handleOpen('password')}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 安全邮箱 */}
            <div className="flex items-center py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Mail className="h-4 w-4" />
                安全邮箱
              </label>
              <p className="text-sm font-medium">{maskEmail(userProfile?.email)}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 ml-1"
                onClick={() => handleOpen('email')}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 安全手机号 */}
            <div className="flex items-center py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Phone className="h-4 w-4" />
                安全手机号
              </label>
              <p className="text-sm font-medium">{maskPhone(userProfile?.phone)}</p>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-1">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 注册时间 */}
            <div className="flex items-center gap-4 py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Calendar className="h-4 w-4" />
                注册时间
              </label>
              <p className="text-sm font-medium flex-1">-</p>
            </div>

            {/* 上次登录 */}
            <div className="flex items-center gap-4 py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Calendar className="h-4 w-4" />
                上次登录
              </label>
              <p className="text-sm font-medium flex-1">-</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            {/* 验证强登录 */}
            <div className="flex items-center gap-4 py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Shield className="h-4 w-4" />
                验证强登录
              </label>
              <p className="text-sm font-medium flex-1">-</p>
            </div>

            {/* 学生验证 */}
            <div className="flex items-center gap-4 py-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-24 shrink-0">
                <Briefcase className="h-4 w-4" />
                学生验证
              </label>
              <p className="text-sm font-medium flex-1">-</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 身份与权限统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            身份与权限统计
          </CardTitle>
          <CardDescription>您的权限和角色概览</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 rounded-lg border p-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">用户</span>
              </div>
              <p className="text-2xl font-bold">2 个</p>
            </div>

            <div className="space-y-2 rounded-lg border p-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">用户组</span>
              </div>
              <p className="text-2xl font-bold">0 个</p>
            </div>

            <div className="space-y-2 rounded-lg border p-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">角色</span>
              </div>
              <p className="text-2xl font-bold">44 个</p>
            </div>

            <div className="space-y-2 rounded-lg border p-4 bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Key className="h-4 w-4" />
                <span className="text-sm font-medium">自定义策略</span>
              </div>
              <p className="text-2xl font-bold">1 个</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统一复用弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {modalType === 'password' && <ChangePasswordForm ref={pwdRef} onSubmit={handleSubmitPassword} />}
            {modalType === 'email' && (
              <ChangeEmailForm ref={emailRef} onSubmit={handleSubmitEmail} onSendCode={handleSendEmailCode} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={confirmLoading}>
              取消
            </Button>
            <Button onClick={handleOk} disabled={confirmLoading}>
              {confirmLoading ? '提交中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountInfoPage;
