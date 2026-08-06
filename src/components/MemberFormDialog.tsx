// ===== 成員 Dialog（MUI v9 相容）=====
import { forwardRef, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Slide,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import type { Group, Member } from '../types'
import { useGroupBuy, type CreateMemberInput } from '../GroupBuyContext'

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

interface FormValues {
  name: string
  note: string
  items: {
    productId: string
    productName: string
    unit: string
    price: number
    quantity: string
  }[]
}

interface Props {
  open: boolean
  onClose: () => void
  group: Group
  editMember?: Member
}

export default function MemberFormDialog({ open, onClose, group, editMember }: Props) {
  const { createMember, updateMember } = useGroupBuy()
  const isEdit = !!editMember

  const buildDefaultItems = () =>
    group.products.map((p) => ({
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      price: p.price,
      quantity: '0',
    }))

  const { register, handleSubmit, reset, control, watch, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: { name: '', note: '', items: buildDefaultItems() },
    })

  const { fields } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  useEffect(() => {
    if (!open) return
    if (isEdit && editMember) {
      reset({
        name: editMember.name,
        note: editMember.note ?? '',
        items: group.products.map((p) => {
          const found = editMember.items.find((i) => i.productId === p.id)
          return {
            productId: p.id,
            productName: p.name,
            unit: p.unit,
            price: p.price,
            quantity: String(found?.quantity ?? 0),
          }
        }),
      })
    } else {
      reset({ name: '', note: '', items: buildDefaultItems() })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const grandTotal = watchedItems?.reduce((sum, item, i) => {
    const qty = parseInt(item.quantity, 10) || 0
    return sum + (group.products[i]?.price ?? 0) * qty
  }, 0) ?? 0

  const onSubmit = (values: FormValues) => {
    const data: CreateMemberInput = {
      groupId: group.id,
      name: values.name.trim(),
      note: values.note.trim() || undefined,
      items: values.items
        .filter((i) => parseInt(i.quantity, 10) > 0)
        .map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity, 10) })),
    }
    if (isEdit) {
      updateMember(editMember!.id, { name: data.name, note: data.note, items: data.items })
    } else {
      createMember(data)
    }
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
        {isEdit ? '編輯參團資料' : '我要參團'}
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ overflowY: 'auto', py: 2 }}>
        <Stack spacing={2.5}>
          <TextField
            label="參團人名稱 *"
            fullWidth
            size="small"
            {...register('name', { required: '請輸入姓名' })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 1.5 }}>
              購買數量
            </Typography>
            <Stack spacing={1.2}>
              {fields.map((field, index) => {
                const qty = parseInt(watchedItems?.[index]?.quantity ?? '0', 10) || 0
                const subtotal = (group.products[index]?.price ?? 0) * qty
                const hasQty = qty > 0

                return (
                  <Controller
                    key={field.id}
                    control={control}
                    name={`items.${index}.quantity`}
                    render={({ field: qtyField }) => (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          border: '1.5px solid',
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {field.productName}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            ${field.price} / {field.unit}
                          </Typography>
                        </Box>

                        <TextField
                          size="small"
                          type="number"
                          slotProps={{
                            htmlInput: { min: 0, style: { textAlign: 'center', width: 48 } },
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                    {field.unit}
                                  </Typography>
                                </InputAdornment>
                              ),
                            },
                          }}
                          {...qtyField}
                          sx={{ width: 108 }}
                        />

                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: 'primary.main', minWidth: 52, textAlign: 'right' }}>
                          ${subtotal}
                        </Typography>
                      </Box>
                    )}
                  />
                )
              })}
            </Stack>

            {/* 合計 */}
            {grandTotal > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'inherit' }}>合計</Typography>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'inherit' }}>${grandTotal}</Typography>
              </Box>
            )}
          </Box>

          <TextField
            label="備註（選填）"
            fullWidth
            size="small"
            {...register('note')}
          />
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          {isEdit ? '儲存' : '確認參團'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
