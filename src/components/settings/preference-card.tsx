"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { preferencesDisplayNames } from "@/data/settings";
import { useSend } from "@/hooks/useSend";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { $preferences } from "@/stores/settings";
import { TasteSettings } from "@/types"; // Import PreferenceSettings type
import { useState } from "react";

export function PreferenceCard({
  preferenceKey,
}: {
  preferenceKey: keyof TasteSettings;
}) {
  const session = usePageSessionStore();
  const [toggleValue, setToggleValue] = useState(() => {
    const sessionValue =
      session.get().context.browserSessionSnapshot?.context.preferences[
        preferenceKey
      ];
    return typeof sessionValue !== "undefined"
      ? sessionValue
        ? "yes"
        : "no"
      : undefined;
  });
  const send = useSend();

  const handleToggle = (value: boolean) => {
    const newValue = toggleValue === (value ? "yes" : "no") ? undefined : value;
    send({
      type: "PREFERENCE_CHANGE",
      preference: preferenceKey,
      value: newValue,
    });
    $preferences.setKey(preferenceKey, newValue);
    setToggleValue(newValue ? "yes" : "no");
  };

  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex-1">
        <label className="font-normal">
          {preferencesDisplayNames[preferenceKey]}
        </label>
      </div>
      <ToggleGroup
        type="single"
        value={toggleValue}
        onValueChange={(value) => handleToggle(value === "yes")}
      >
        <ToggleGroupItem variant="outline" value="no">
          No
        </ToggleGroupItem>
        <ToggleGroupItem variant="outline" value="yes">
          Yes
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
