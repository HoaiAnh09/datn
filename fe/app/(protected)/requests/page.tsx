'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/common/stores/auth.store';
import { RentalRequest, RentalRequestStatus } from '@/common/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { RentalRequestDetailDialog } from '@/features/rental-request/components/rental-request-detail-dialog';
import {
  useApproveRentalRequest,
  useCancelRentalRequest,
  useMyRentalRequests,
  useRejectRentalRequest,
  useRentalRequests,
} from '@/features/rental-request/hooks/use-rental-requests';

function formatCurrency(value: number) {
  return `${Number(value).toLocaleString('vi-VN')} đ`;
}

function getChargeableRentalDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function calcRequestPricing(request: RentalRequest) {
  const days = getChargeableRentalDays(request.rentalStartDate, request.rentalEndDate);
  return request.items.reduce(
    (acc, item) => {
      acc.rental += item.unitPrice * item.quantity * days;
      acc.deposit += item.depositAmount * item.quantity;
      return acc;
    },
    { rental: 0, deposit: 0 },
  );
}

const requestStatusLabels: Record<RentalRequestStatus, string> = {
  SUBMITTED: 'Mới gửi',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};



function CustomerRequestsView() {
  const { data: requestsResponse } = useMyRentalRequests();
  const cancelMutation = useCancelRentalRequest();
  const [detailRequest, setDetailRequest] = useState<RentalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const requests = useMemo(
    () => requestsResponse?.data ?? [],
    [requestsResponse?.data],
  );

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">Yêu cầu đặt thuê của tôi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Yêu cầu online sẽ được owner duyệt trước khi tạo đơn thuê chính thức.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
            Bạn chưa có yêu cầu đặt thuê nào.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/30">
                <TableHead>Mã yêu cầu</TableHead>
                <TableHead>Ngày thuê</TableHead>
                <TableHead>Ngày trả</TableHead>
                <TableHead>Tiền thuê</TableHead>
                <TableHead>Tiền cọc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const pricing = calcRequestPricing(request);
                return (
                  <TableRow key={request.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">#{request.id}</TableCell>
                    <TableCell>{request.rentalStartDate}</TableCell>
                    <TableCell>{request.rentalEndDate}</TableCell>
                    <TableCell>{formatCurrency(pricing.rental)}</TableCell>
                    <TableCell>{formatCurrency(pricing.deposit)}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {requestStatusLabels[request.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDetailRequest(request);
                            setDetailOpen(true);
                          }}
                        >
                          Xem
                        </Button>
                        {request.status === RentalRequestStatus.SUBMITTED && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(request.id)}
                          >
                            Hủy
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <RentalRequestDetailDialog
        open={detailOpen}
        onOpenChange={(nextOpen) => {
          setDetailOpen(nextOpen);
          if (!nextOpen) setDetailRequest(null);
        }}
        request={detailRequest}
      />
    </div>
  );
}

function OwnerRequestsView() {
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [pickupDeadlineAt, setPickupDeadlineAt] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [detailRequest, setDetailRequest] = useState<RentalRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data } = useRentalRequests({
    status: status || undefined,
    search: search || undefined,
  });
  const approveMutation = useApproveRentalRequest();
  const rejectMutation = useRejectRentalRequest();

  const requests = useMemo(() => data?.data ?? [], [data?.data]);
  const submittedCount = useMemo(
    () => requests.filter((item) => item.status === RentalRequestStatus.SUBMITTED).length,
    [requests],
  );

  const openApproveDialog = (request: RentalRequest) => {
    setSelectedRequest(request);
    setPickupDeadlineAt('');
    setReviewNote('');
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (request: RentalRequest) => {
    setSelectedRequest(request);
    setRejectNote('');
    setRejectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)]">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Tổng yêu cầu</p>
            <p className="mt-2 text-3xl font-semibold">{requests.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)]">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="mt-2 text-3xl font-semibold">{submittedCount}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 rounded-[1.6rem] border-0 bg-white shadow-[0_12px_32px_rgba(120,134,164,0.12)] lg:col-span-1">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Đã chuyển thành đơn</p>
            <p className="mt-2 text-3xl font-semibold">
              {requests.filter((item) => Boolean(item.approvedOrderId)).length}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 rounded-3xl border border-[var(--page-divider)] bg-[var(--page-panel)] p-6 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, số điện thoại..."
            className="h-11 rounded-full"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant={status === '' ? 'default' : 'outline'} size="sm" onClick={() => setStatus('')}>
              Tất cả
            </Button>
            {Object.entries(requestStatusLabels).map(([value, label]) => (
              <Button
                key={value}
                variant={status === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--page-divider)] p-6 text-center text-sm text-muted-foreground">
            Không có yêu cầu nào phù hợp.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/30">
                <TableHead>Mã yêu cầu</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày thuê</TableHead>
                <TableHead>Ngày trả</TableHead>
                <TableHead>Tiền thuê</TableHead>
                <TableHead>Tiền cọc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const pricing = calcRequestPricing(request);
                return (
                  <TableRow key={request.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">#{request.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.user?.fullName || '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.user?.phoneNumber || 'Chưa có SĐT'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{request.rentalStartDate}</TableCell>
                    <TableCell>{request.rentalEndDate}</TableCell>
                    <TableCell>{formatCurrency(pricing.rental)}</TableCell>
                    <TableCell>{formatCurrency(pricing.deposit)}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {requestStatusLabels[request.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDetailRequest(request);
                            setDetailOpen(true);
                          }}
                        >
                          Xem
                        </Button>
                        {request.status === RentalRequestStatus.SUBMITTED && (
                          <>
                            <Button size="sm" onClick={() => openApproveDialog(request)}>
                              Duyệt
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openRejectDialog(request)}>
                              Từ chối
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu đặt thuê</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickupDeadlineAt">Hạn đến lấy đồ</Label>
              <Input
                id="pickupDeadlineAt"
                type="datetime-local"
                value={pickupDeadlineAt}
                onChange={(event) => setPickupDeadlineAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewNote">Ghi chú</Label>
              <Textarea
                id="reviewNote"
                rows={4}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="Ví dụ: giữ hàng đến 18:00 hôm nay, vui lòng mang CCCD..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Đóng
            </Button>
            <Button
              disabled={!selectedRequest || approveMutation.isPending}
              onClick={() => {
                if (!selectedRequest) {
                  return;
                }
                approveMutation.mutate(
                  {
                    id: selectedRequest.id,
                    data: {
                      pickupDeadlineAt: pickupDeadlineAt
                        ? new Date(pickupDeadlineAt).toISOString()
                        : undefined,
                      reviewNote: reviewNote.trim() || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      setApproveDialogOpen(false);
                      setSelectedRequest(null);
                    },
                  },
                );
              }}
            >
              Duyệt yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu đặt thuê</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectNote">Lý do từ chối</Label>
            <Textarea
              id="rejectNote"
              rows={4}
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              placeholder="Ví dụ: hết size trong khoảng thời gian bạn chọn..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Đóng
            </Button>
            <Button
              variant="destructive"
              disabled={!selectedRequest || rejectMutation.isPending || !rejectNote.trim()}
              onClick={() => {
                if (!selectedRequest || !rejectNote.trim()) {
                  return;
                }
                rejectMutation.mutate(
                  { id: selectedRequest.id, reviewNote: rejectNote.trim() },
                  {
                    onSuccess: () => {
                      setRejectDialogOpen(false);
                      setSelectedRequest(null);
                    },
                  },
                );
              }}
            >
              Từ chối yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RentalRequestDetailDialog
        open={detailOpen}
        onOpenChange={(nextOpen) => {
          setDetailOpen(nextOpen);
          if (!nextOpen) setDetailRequest(null);
        }}
        request={detailRequest}
      />
    </div>
  );
}

export default function RequestsPage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'CUSTOMER') {
    return <CustomerRequestsView />;
  }

  return <OwnerRequestsView />;
}
