// components/ZoneTag.jsx
// Small coloured label for a space type, like a zone sign in a building.

import { Armchair, DoorClosed, Users } from "lucide-react";
import { typeLabel } from "../utils/format";

const ICONS = { "hot-desk": Armchair, "meeting-room": Users, "private-cabin": DoorClosed };

export default function ZoneTag({ type }) {
  const Icon = ICONS[type] || Users;
  return (
    <span className={`zone-tag zone-${type}`}>
      <Icon size={14} aria-hidden />
      {typeLabel(type)}
    </span>
  );
}
