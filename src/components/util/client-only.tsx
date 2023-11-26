import { ReactNode, useLayoutEffect, useState } from "react";

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useLayoutEffect(() => {
    // This will run only once after the initial render
    setIsClient(true);
  }, []);

  // Don't render on server
  if (!isClient) {
    return null;
  }

  return children;
};

export default ClientOnly;
