import React, { memo } from 'react';
import ItemQuantityModal from './ItemQuantityModal';

interface EditItemModalProps {
  visible: boolean;
  title: string;
  quantity: string;
  onQuantityChange: (quantity: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const EditItemModal: React.FC<EditItemModalProps> = props => (
  <ItemQuantityModal {...props} label="Edit Quantity" buttonTitle="Update" />
);

export default memo(EditItemModal);
