import { useState } from 'react';
import { RecordSuccessType } from '../components/RecordSuccessAlert';

export interface SuccessAlertState {
  visible: boolean;
  type: RecordSuccessType;
  title: string;
  subtitle: string;
  details: { label: string; value: string }[];
}

export function useRecordSuccess() {
  const [successAlert, setSuccessAlert] = useState<SuccessAlertState>({
    visible: false,
    type: 'generic',
    title: '',
    subtitle: '',
    details: [],
  });

  const showSuccess = (
    type: RecordSuccessType,
    title: string,
    subtitle: string,
    details: { label: string; value: string }[] = [],
  ) => {
    setSuccessAlert({
      visible: true,
      type,
      title,
      subtitle,
      details,
    });
  };

  const hideSuccess = () => {
    setSuccessAlert((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  return {
    successAlert,
    showSuccess,
    hideSuccess,
  };
}
