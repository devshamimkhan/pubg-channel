const DEFAULT_UPLOAD_ENDPOINT = "/api/proxy-upload";

function getUploadedFileType(mimetype = "") {
  return mimetype.startsWith("video/") ? "video" : "image";
}

function resolveUploadOptions(endpointOrOptions = DEFAULT_UPLOAD_ENDPOINT) {
  if (typeof endpointOrOptions === "string") {
    return { endpoint: endpointOrOptions, onProgress: null };
  }

  if (endpointOrOptions && typeof endpointOrOptions === "object") {
    return {
      endpoint: endpointOrOptions.endpoint || DEFAULT_UPLOAD_ENDPOINT,
      onProgress: typeof endpointOrOptions.onProgress === "function" ? endpointOrOptions.onProgress : null,
    };
  }

  return { endpoint: DEFAULT_UPLOAD_ENDPOINT, onProgress: null };
}

function normalizeUploadFiles(files) {
  return Array.from(files || []).filter(Boolean);
}

async function parseUploadResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Upload failed");
  }

  if (!data?.success) {
    throw new Error(data?.message || "Upload failed");
  }

  return Array.isArray(data.files) ? data.files : [];
}

function sendMultipartFormData(formData, endpoint, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", endpoint);
    xhr.responseType = "json";

    xhr.onload = () => {
      const responseData =
        xhr.response && typeof xhr.response === "object"
          ? xhr.response
          : (() => {
              try {
                return JSON.parse(xhr.responseText || "null");
              } catch {
                return null;
              }
            })();

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(responseData?.message || "Upload failed"));
        return;
      }

      if (!responseData?.success) {
        reject(new Error(responseData?.message || "Upload failed"));
        return;
      }

      resolve(Array.isArray(responseData.files) ? responseData.files : []);
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed"));
    };

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: event.total ? Math.round((event.loaded / event.total) * 100) : 0,
        });
      };
    }

    xhr.send(formData);
  });
}

export async function uploadMediaFiles(files, endpointOrOptions = DEFAULT_UPLOAD_ENDPOINT) {
  const validFiles = normalizeUploadFiles(files);
  if (validFiles.length === 0) return [];

  const { endpoint, onProgress } = resolveUploadOptions(endpointOrOptions);
  const formData = new FormData();

  validFiles.forEach((file) => {
    formData.append("files", file);
  });

  if (typeof XMLHttpRequest !== "undefined") {
    const uploadedFiles = await sendMultipartFormData(formData, endpoint, onProgress);
    return uploadedFiles.map((file) => ({
      url: file.url,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      type: getUploadedFileType(file.mimetype),
    }));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const uploadedFiles = await parseUploadResponse(response);

  return uploadedFiles.map((file) => ({
    url: file.url,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    type: getUploadedFileType(file.mimetype),
  }));
}

export async function uploadSingleMediaFile(file, endpointOrOptions = DEFAULT_UPLOAD_ENDPOINT) {
  const [uploaded] = await uploadMediaFiles([file], endpointOrOptions);
  return uploaded || null;
}

export { DEFAULT_UPLOAD_ENDPOINT };
