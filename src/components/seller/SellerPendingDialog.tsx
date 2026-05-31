"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";

/**
 * 공급자 가입 직후 한 번만 보여지는 안내 다이얼로그.
 * sessionStorage 사용 — 세션 동안 한 번만 표시.
 * 확인 누르면 닫히고 페이지 내용은 그대로 유지.
 */
export function SellerPendingDialog({ status }: { status: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 승인된 상태는 모달 안 띄움
    if (status === "approved") return;

    // 한 번 본 사용자에겐 다시 안 띄움 (세션 동안)
    const seen = sessionStorage.getItem("seller_pending_seen");
    if (!seen) {
      setOpen(true);
    }
  }, [status]);

  const handleClose = () => {
    sessionStorage.setItem("seller_pending_seen", "1");
    setOpen(false);
  };

  // 상태별 모달 내용
  const dialogContent = {
    pending: {
      title: "공급자 신청이 완료되었습니다",
      variant: "info" as const,
      message: "관리자가 신청 내용을 검토하고 있어요. 보통 1~2영업일 안에 처리되며, 승인되면 공급자 대시보드를 사용할 수 있어요.",
    },
    rejected: {
      title: "신청이 거절되었습니다",
      variant: "warn" as const,
      message: "거절 사유를 확인하고 정보를 수정한 뒤 다시 신청해주세요.",
    },
    blocked: {
      title: "계정이 차단되었습니다",
      variant: "warn" as const,
      message: "관리자에게 문의해주세요.",
    },
  };

  const content = dialogContent[status as keyof typeof dialogContent] ?? dialogContent.pending;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={content.title}
      variant={content.variant}
      primaryLabel="확인"
      onPrimary={handleClose}
    >
      {content.message}
    </Modal>
  );
}
