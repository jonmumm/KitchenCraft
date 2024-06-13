import { XCircleIcon } from "lucide-react";
import { Button } from "./input/button";

export const ExitButton = () => (
  <Button
    size="icon"
    variant="ghost"
    autoFocus={false}
    event={{ type: "EXIT" }}
  >
    <XCircleIcon />
  </Button>
);
