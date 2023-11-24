export const extractMetadata = (file: File) => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () =>
        resolve({ type: "IMAGE", width: img.width, height: img.height });
      img.src = URL.createObjectURL(file);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.onloadedmetadata = () =>
        resolve({
          type: "VIDEO",
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      video.src = URL.createObjectURL(file);
    } else {
      reject(new Error("Unsupported file type"));
    }
  });
};
