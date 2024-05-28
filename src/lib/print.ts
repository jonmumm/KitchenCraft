export const openAndPrintURL = (url: string) => {
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.addEventListener(
      "load",
      () => {
        printWindow.print();
        printWindow.close();
      },
      { once: true }
    );
  }
};
