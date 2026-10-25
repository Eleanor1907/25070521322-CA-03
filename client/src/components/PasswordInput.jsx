// components/PasswordInput.jsx
// Password box with a show/hide button. Any props (id, value, onChange,
// aria-* from <Field>) go to the real <input>, so the label stays connected.

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-with-button">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="icon-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
