import { type ReactNode, createContext, useContext } from 'react'
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Form 配置 Context
interface FormConfigContextValue {
  labelAlign?: 'left' | 'right' | 'center'
  labelWidth?: string
}

const FormConfigContext = createContext<FormConfigContextValue>({})

export const useFormConfig = () => useContext(FormConfigContext)

// Form 配置 Provider
interface FormConfigProviderProps {
  children: ReactNode
  labelAlign?: 'left' | 'right' | 'center'
  labelWidth?: string
}

export function FormConfigProvider({ children, labelAlign, labelWidth }: FormConfigProviderProps) {
  return (
    <FormConfigContext.Provider value={{ labelAlign, labelWidth }}>
      {children}
    </FormConfigContext.Provider>
  )
}

// 字段类型
type FieldType = 'input' | 'textarea' | 'select' | 'switch' | 'number' | 'custom'

// 选项类型
interface SelectOption {
  label: string
  value: string
}

// 字段配置
interface FormFieldConfig<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>
  label: string
  type?: FieldType
  placeholder?: string
  options?: SelectOption[] // 用于 select
  className?: string
  labelClassName?: string
  inputClassName?: string
  disabled?: boolean
  render?: (field: any) => ReactNode // 自定义渲染
  layout?: 'horizontal' | 'vertical' // 布局方式
  labelWidth?: string // label 宽度，默认 w-[80px]
  labelAlign?: 'left' | 'right' | 'center' // label 对齐方式，默认 left
}

interface FormFieldWrapperProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  config: FormFieldConfig<TFieldValues>
}

export function FormFieldWrapper<TFieldValues extends FieldValues = FieldValues>({
  control,
  config,
}: FormFieldWrapperProps<TFieldValues>) {
  // 获取全局配置
  const formConfig = useFormConfig()
  
  const {
    name,
    label,
    type = 'input',
    placeholder,
    options = [],
    className,
    labelClassName,
    inputClassName,
    disabled = false,
    render,
    layout = 'horizontal',
    labelWidth,
    labelAlign,
  } = config

  // 优先级：字段配置 > FormFields 配置 > FormConfigProvider 配置 > 默认值
  const finalLabelWidth = labelWidth || formConfig.labelWidth || 'w-[80px]'
  const finalLabelAlign = labelAlign || formConfig.labelAlign || 'left'

  // 对齐方式映射 - 使用完整类名确保 Tailwind 能正确编译
  const getAlignClass = () => {
    if (finalLabelAlign === 'right') return 'text-right'
    if (finalLabelAlign === 'center') return 'text-center'
    return 'text-left'
  }
  const alignClass = getAlignClass()

  // 渲染不同类型的输入控件
  const renderInput = (field: any) => {
    if (render) {
      return render(field)
    }

    switch (type) {
      case 'input':
        return (
          <Input
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
            {...field}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
            {...field}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
            {...field}
          />
        )

      case 'select':
        return (
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className={`w-full ${inputClassName || ''}`}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'switch':
        return (
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        )

      default:
        return (
          <Input
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
            {...field}
          />
        )
    }
  }

  // 水平布局
  if (layout === 'horizontal') {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={`flex items-center gap-3 ${className || ''}`}>
            <FormLabel className={`${finalLabelWidth} ${alignClass} shrink-0 ${labelClassName || ''}`}>
              {label}
            </FormLabel>
            <div className="flex-1">
              <FormControl>{renderInput(field)}</FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    )
  }

  // 垂直布局
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={labelClassName}>{label}</FormLabel>
          <FormControl>{renderInput(field)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// 批量渲染表单字段的辅助组件
interface FormFieldsProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  fields: FormFieldConfig<TFieldValues>[]
  columns?: 1 | 2 | 3 | 4
  gap?: string
  labelAlign?: 'left' | 'right' | 'center' // 统一配置所有字段的对齐方式
  labelWidth?: string // 统一配置所有字段的 label 宽度
}

export function FormFields<TFieldValues extends FieldValues = FieldValues>({
  control,
  fields,
  columns = 2,
  gap = 'gap-8',
  labelAlign,
  labelWidth,
}: FormFieldsProps<TFieldValues>) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div className={`grid ${gridCols[columns]} ${gap}`}>
      {fields.map((fieldConfig) => (
        <FormFieldWrapper
          key={fieldConfig.name}
          control={control}
          config={{
            ...fieldConfig,
            // 如果 FormFields 指定了统一配置，则使用统一配置，否则使用字段自己的配置
            labelAlign: labelAlign || fieldConfig.labelAlign,
            labelWidth: labelWidth || fieldConfig.labelWidth,
          }}
        />
      ))}
    </div>
  )
}
