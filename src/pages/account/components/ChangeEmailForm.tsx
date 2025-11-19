import { forwardRef, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface ChangeEmailValues {
  email: string;
  code: string;
}

export interface ChangeEmailFormRef {
  submit: () => void;
}

interface ChangeEmailFormProps {
  onSubmit: (values: ChangeEmailValues) => void | Promise<void>;
  onSendCode: (email: string) => void | Promise<void>;
}

const ChangeEmailForm = forwardRef<ChangeEmailFormRef, ChangeEmailFormProps>(
  ({ onSubmit, onSendCode }, ref) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
    } = useForm<ChangeEmailValues>();

    const [countdown, setCountdown] = useState(0);
    const email = watch('email');

    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit(onSubmit)();
      },
    }));

    const handleSendCode = async () => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return;
      }
      await onSendCode(email);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">新邮箱地址</Label>
          <Input
            id="email"
            type="email"
            placeholder="请输入新邮箱地址"
            {...register('email', {
              required: '请输入邮箱地址',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: '请输入有效的邮箱地址',
              },
            })}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">验证码</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              placeholder="请输入验证码"
              {...register('code', { required: '请输入验证码' })}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSendCode}
              disabled={countdown > 0 || !email}
              className="shrink-0"
            >
              {countdown > 0 ? `${countdown}秒` : '发送验证码'}
            </Button>
          </div>
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
      </form>
    );
  }
);

ChangeEmailForm.displayName = 'ChangeEmailForm';

export default ChangeEmailForm;
