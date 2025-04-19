export const resizeImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // تصغير الأبعاد مع الحفاظ على النسبة
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height *= maxWidth / width;
              width = maxWidth;
            } else {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Error creating canvas");

          ctx.drawImage(img, 0, 0, width, height);

          // تحويل الصورة إلى Blob ثم إلى File
          canvas.toBlob((blob) => {
            if (!blob) return reject("Error compressing image");
            const resizedFile = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
            resolve(resizedFile);
          }, "image/jpeg", 0.8); // جودة الصورة 80%
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };
