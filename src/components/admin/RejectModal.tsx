import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from '@heroui/react';

interface RejectModalProps {
  isOpen: boolean;
  /** Title of the document being rejected, for context. */
  documentTitle?: string;
  isLoading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** Reject-with-required-reason modal for the moderation queue. */
export function RejectModal({
  isOpen,
  documentTitle,
  isLoading = false,
  onConfirm,
  onClose,
}: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset the field whenever the modal (re)opens.
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setTouched(false);
    }
  }, [isOpen]);

  const trimmed = reason.trim();
  const isInvalid = touched && trimmed === '';

  function handleConfirm() {
    setTouched(true);
    if (trimmed === '') return;
    onConfirm(trimmed);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDismissable={!isLoading}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>Rechazar documento</span>
          {documentTitle && (
            <span className="text-xs font-normal text-default-500">{documentTitle}</span>
          )}
        </ModalHeader>
        <ModalBody>
          <Textarea
            label="Motivo del rechazo"
            placeholder="Explica por qué se rechaza este documento. El autor podrá verlo."
            value={reason}
            onValueChange={setReason}
            onBlur={() => setTouched(true)}
            isRequired
            isInvalid={isInvalid}
            errorMessage={isInvalid ? 'El motivo es obligatorio.' : undefined}
            minRows={3}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button color="danger" onPress={handleConfirm} isLoading={isLoading}>
            Rechazar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
