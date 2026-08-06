// ===== 新增/編輯團購 Dialog（MUI v9 相容）=====
import { forwardRef, useEffect, useRef } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Slide,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import type { TransitionProps } from '@mui/material/transitions'
import dayjs from 'dayjs'
import type { Group, Member } from '../types'
import { useGroupBuy, type CreateGroupInput } from '../GroupBuyContext'

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

interface FormValues {
  title: string
  description: string
  deadline: dayjs.Dayjs | null
  products: { productId?: string; name: string; unit: string; price: string; note: string }[]
}

interface Props {
  open: boolean
  onClose: () => void
  editGroup?: Group
  members?: Member[]
}

export default function GroupFormDialog({ open, onClose, editGroup, members }: Props) {
  const { createGroup, updateGroup } = useGroupBuy()
  const isEdit = !!editGroup
  const scrollRef = useRef<HTMLDivElement>(null)

  const defaultValues: FormValues = {
    title: '',
    description: '',
    deadline: dayjs().add(7, 'day'),
    products: [{ productId: undefined, name: '', unit: '份', price: '', note: '' }],
  }

  const { control, register, handleSubmit, reset, formState: { errors } } =
    useForm<FormValues>({ defaultValues })

  const { fields, append, remove } = useFieldArray({ control, name: 'products' })

  useEffect(() => {
    if (!open) return
    if (isEdit && editGroup) {
      reset({
        title: editGroup.title,
        description: editGroup.description ?? '',
        deadline: dayjs(editGroup.deadline),
        products: editGroup.products.map((p) => ({
          productId: p.id,
          name: p.name,
          unit: p.unit,
          price: String(p.price),
          note: p.note ?? '',
        })),
      })
    } else {
      reset(defaultValues)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const orderedProductIds = Array.from(
    new Set(
      members
        ?.flatMap((m) => m.items)
        .filter((item) => item.quantity > 0)
        .map((item) => item.productId) ?? []
    )
  )

  const onSubmit = (values: FormValues) => {
    const data: CreateGroupInput = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      deadline: (values.deadline ?? dayjs()).toISOString(),
      products: values.products
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          unit: p.unit.trim() || '份',
          price: parseFloat(p.price) || 0,
          note: p.note.trim() || undefined,
        })),
    }
    isEdit ? updateGroup(editGroup!.id, data) : createGroup(data)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slots={{ transition: SlideUp }}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            mx: 2,
            maxHeight: '90vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1 }}>
        {isEdit ? '編輯團購' : '新增團購'}
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ overflowY: 'auto', py: 2 }} ref={scrollRef}>
        <Stack spacing={2.5}>
          <TextField
            label="團購名稱 *"
            fullWidth
            size="small"
            {...register('title', { required: '請輸入名稱' })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />

          <TextField
            label="說明（選填）"
            fullWidth
            size="small"
            multiline
            rows={2}
            {...register('description')}
          />

          <Controller
            control={control}
            name="deadline"
            rules={{ required: '請選擇截止日期' }}
            render={({ field, fieldState }) => (
              <DatePicker
                label="截止日期 *"
                value={field.value}
                onChange={field.onChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />

          <Divider />

          {/* 商品清單 */}
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 1.5 }}>商品項目</Typography>

            <Stack spacing={1.5}>
              {fields.map((field, index) => {
                const isOrdered = field.productId ? orderedProductIds.includes(field.productId) : false

                return (
                <Box
                  key={field.id}
                  sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                        商品 {index + 1}
                      </Typography>
                      {isOrdered && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'error.main' }}>
                          (已有人選購，無法修改)
                        </Typography>
                      )}
                    </Box>
                    {fields.length > 1 && !isOrdered && (
                      <IconButton size="small" color="error" onClick={() => remove(index)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="名稱"
                        size="small"
                        sx={{ flex: 2 }}
                        disabled={isOrdered}
                        {...register(`products.${index}.name`, {
                          required: index === 0 ? '請輸入商品名稱' : false,
                        })}
                        error={!!errors.products?.[index]?.name}
                        helperText={errors.products?.[index]?.name?.message}
                      />
                      <TextField
                        label="單位"
                        size="small"
                        sx={{ flex: 1 }}
                        disabled={isOrdered}
                        {...register(`products.${index}.unit`)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="單價（元）"
                        size="small"
                        type="number"
                        sx={{ flex: 1 }}
                        disabled={isOrdered}
                        slotProps={{ htmlInput: { min: 0 } }}
                        {...register(`products.${index}.price`)}
                      />
                      <TextField
                        label="備註（選填）"
                        size="small"
                        sx={{ flex: 2 }}
                        disabled={isOrdered}
                        {...register(`products.${index}.note`)}
                      />
                    </Box>
                  </Stack>
                </Box>
              )})}
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 1.5, borderStyle: 'dashed', borderWidth: 1.5, py: 1 }}
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => {
                append({ productId: undefined, name: '', unit: '份', price: '', note: '' })
                setTimeout(() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                  }
                }, 10)
              }}
            >
              新增商品
            </Button>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          {isEdit ? '儲存' : '建立'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
