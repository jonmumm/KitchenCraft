import Link, { LinkProps } from "next/link";
import { ReactNode, Suspense } from "react";
import { Observable, firstValueFrom } from "rxjs";

type LinkFromFirstValue<T> = {
  observable: Observable<string | undefined>;
  children: ReactNode;
  fallbackUrl: string;
} & Omit<LinkProps, "href"> & { className: string };

export const LinkFromFirstValue = <T,>({
  observable,
  children,
  fallbackUrl,
  className,
}: LinkFromFirstValue<T>) => {
  const AsyncComponent = async () => {
    const value = await firstValueFrom(observable);
    return (
      <Link className={className} href={value || fallbackUrl}>
        {children}
      </Link>
    );
  };

  return (
    <Suspense fallback={<>{children}</>}>
      <AsyncComponent />
    </Suspense>
  );
};
