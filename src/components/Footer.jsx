import { useRef } from 'react';

export default function Footer({ saveText, isEditMode, onToggleEdit, onShare, onExport, onImport, onImportFromLink, onReset, onSignOut }) {
  const fileRef = useRef(null);

  function handleImportClick() { fileRef.current?.click(); }
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) onImport(file);
    e.target.value = '';
  }

  return (
    <>
      <div className="foot">
        <div className="save-state">
          <span className="pulse"></span>
          <span>{saveText}</span>
        </div>
        <div className="foot-btns">
          <button className={`btn${isEditMode ? ' btn-active' : ''}`} onClick={onToggleEdit}>
            {isEditMode ? 'Done editing' : 'Edit sections'}
          </button>
          <button className="btn" onClick={onShare}>Share</button>
          <button className="btn" onClick={onExport}>Export</button>
          <button className="btn" onClick={handleImportClick}>Import</button>
          <button className="btn" onClick={onImportFromLink}>Import from link</button>
          <button className="btn danger" onClick={onReset}>Reset all</button>
          <button className="btn" onClick={onSignOut}>Sign out</button>
          <input type="file" ref={fileRef} accept="application/json" hidden onChange={handleFileChange} />
        </div>
      </div>
      <p className="note">
        Made in Bangalore ❤️ by Hrithik
      </p>
    </>
  );
}
