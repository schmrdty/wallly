import React from 'react';

interface PermissionPreviewProps {
  onPreview: () => void;
  loading: boolean;
  showPreview: boolean;
  preview: any;
}

export const PermissionPreview: React.FC<PermissionPreviewProps> = ({
  onPreview,
  loading,
  showPreview,
  preview
}) => (
  <div>
    <button type="button" onClick={onPreview} disabled={loading}>
      Preview Contract
    </button>
    {showPreview && preview && (
      <div>
        <h3>Contract Preview</h3>
        <pre>{JSON.stringify(preview, null, 2)}</pre>
      </div>
    )}
  </div>
);
