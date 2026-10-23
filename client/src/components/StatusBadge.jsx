import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Zap, Radio } from 'lucide-react';

export const StatusBadge = ({ status, type = 'hazard' }) => {
  if (!status) return null;

  if (type === 'hazard') {
    switch (status) {
      case 'Corroborated Hazard':
        return (
          <span className="badge badge-corroborated">
            <ShieldCheck size={12} /> Corroborated
          </span>
        );
      case 'Multiple Reports':
        return (
          <span className="badge badge-multiple">
            <Radio size={12} /> Multiple Reports
          </span>
        );
      case 'Official Alert':
        return (
          <span className="badge badge-official">
            <Zap size={12} /> Official Alert
          </span>
        );
      case 'Resolved':
        return (
          <span className="badge badge-resolved">
            <CheckCircle size={12} /> Resolved
          </span>
        );
      case 'Expired':
        return (
          <span className="badge badge-resolved">
            <Clock size={12} /> Expired
          </span>
        );
      case 'Unverified Report':
      default:
        return (
          <span className="badge badge-unverified">
            <AlertTriangle size={12} /> Unverified
          </span>
        );
    }
  }

  if (type === 'severity') {
    switch (status) {
      case 'Critical':
        return <span className="badge badge-critical">Critical</span>;
      case 'High':
        return <span className="badge badge-critical" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171' }}>High</span>;
      case 'Medium':
        return <span className="badge badge-unverified">Medium</span>;
      case 'Low':
      default:
        return <span className="badge badge-multiple">Low</span>;
    }
  }

  if (type === 'notification') {
    switch (status) {
      case 'acknowledged':
        return <span className="badge badge-corroborated">Acknowledged</span>;
      case 'delivered':
        return <span className="badge badge-multiple">Delivered</span>;
      case 'sent':
        return <span className="badge badge-multiple" style={{ background: 'rgba(58, 134, 255, 0.1)' }}>Sent</span>;
      case 'queued_locally':
        return <span className="badge badge-unverified">Queued Locally</span>;
      case 'failed':
        return <span className="badge badge-critical">Failed</span>;
      default:
        return <span className="badge badge-resolved">{status}</span>;
    }
  }

  return <span className="badge badge-multiple">{status}</span>;
};
