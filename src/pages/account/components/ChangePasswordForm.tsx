import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ChangePasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFormRef {
  submit: () => void;
}

interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordValues) => void | Promise<void>;
}

const ChangePasswordForm = forwardRef<ChangePasswordFormRef, ChangePasswordFormProps>(
  ({ onSubmit }, ref) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
    } = useForm<ChangePasswordValues>();

    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit(onSubmit)();
      },
    }));

    const newPassword = watch('newPassword');

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="oldPassword">当前密码</Label>
          <Input
            id="oldPassword"
            type="password"
            placeholder="请输入当前密码"
            {...register('oldPassword', { required: '请输入当前密码' })}
          />
          {errors.oldPassword && (
            <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">新密码</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="请输入新密码"
            {...register('newPassword', {
              required: '请输入新密码',
              minLength: { value: 6, message: '密码至少6位' },
            })}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认新密码</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            {...register('confirmPassword', {
              required: '请确认新密码',
              validate: (value) => value === newPassword || '两次密码输入不一致',
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
      </form>
    );
  }
);

ChangePasswordForm.displayName = 'ChangePasswordForm';

export default ChangePasswordForm;
