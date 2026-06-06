import { useRef } from 'react';

export default function Footer({ saveText, syncOn, canEdit, onExport, onImport, onReset, onAuthClick }) {
  const fileRef = useRef(null);

  function handleImportClick() {
    fileRef.current?.click();
  }

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
          {syncOn && (
            <button className="btn" onClick={onAuthClick}>
              {canEdit ? 'Sign out' : 'Owner sign-in'}
            </button>
          )}
          <button className="btn" onClick={onExport}>Export backup</button>
          <button className="btn" onClick={handleImportClick}>Import backup</button>
          <button className="btn danger" onClick={onReset}>Reset all</button>
          <input type="file" ref={fileRef} accept="application/json" hidden onChange={handleFileChange} />
        </div>
      </div>

      <p className="note">
        NeetCode 150 · Grokking Modern System Design Interview · Head First Design Patterns
        <br />
        Code every problem with AI off. Apply by August. Mocks from September.
      </p>
    </>
  );
}
