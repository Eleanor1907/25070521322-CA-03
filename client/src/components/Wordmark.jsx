// components/Wordmark.jsx
// The FLEXI logo: the name plus a tiny three-block strip in the zone colours.

import { Link } from "react-router-dom";

export default function Wordmark({ to = "/", onClick }) {
  return (
    <Link to={to} className="wordmark" aria-label="FLEXI home" onClick={onClick}>
      <span className="wordmark__text">FLEXI</span>
      <span className="wordmark__mark" aria-hidden="true">
        <i className="zone-hot-desk" />
        <i className="zone-meeting-room" />
        <i className="zone-private-cabin" />
      </span>
    </Link>
  );
}
