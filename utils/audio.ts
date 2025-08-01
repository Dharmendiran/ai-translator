
export const toBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // remove the data URL prefix
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
};
