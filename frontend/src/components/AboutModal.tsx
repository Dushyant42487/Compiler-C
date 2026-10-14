import React from 'react';
import { IseGuideModal } from './IseGuideModal';
import { CompilerInfoResponse } from '../types/compiler';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  info?: CompilerInfoResponse | null;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, info }) => {
  return <IseGuideModal isOpen={isOpen} onClose={onClose} info={info} />;
};
