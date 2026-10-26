// components/TypeTag.jsx
// "Hot desk", "Meeting room" or "Private cabin" with a matching icon.

import { Armchair } from "lucide-react";
import { typeLabel } from "../utils/format";
import { TYPE_ICONS } from "../utils/typeIcons";

export default function TypeTag({ type }) {
  const Icon = TYPE_ICONS[type] || Armchair;
  return (
    <span className="type-tag">
      <Icon size={15} aria-hidden />
      {typeLabel(type)}
    </span>
  );
}
