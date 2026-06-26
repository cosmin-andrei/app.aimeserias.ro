export type MicrophoneAccessResult =
    | { ok: true; stream: MediaStream }
    | { ok: false; error: string; canRetry: boolean };

export async function queryMicrophonePermission(): Promise<PermissionState | "unsupported"> {
    if (!navigator.permissions?.query) {
        return "unsupported";
    }

    try {
        const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
        return status.state;
    } catch {
        return "unsupported";
    }
}

export async function requestMicrophoneAccess(): Promise<MicrophoneAccessResult> {
    if (typeof window === "undefined") {
        return { ok: false, error: "Apelul nu este disponibil.", canRetry: false };
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        return {
            ok: false,
            error: "Browserul tău nu suportă apeluri vocale. Folosește Chrome, Edge sau Firefox.",
            canRetry: false,
        };
    }

    if (!window.isSecureContext) {
        return {
            ok: false,
            error: "Microfonul funcționează doar pe conexiuni securizate (HTTPS).",
            canRetry: false,
        };
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
            video: false,
        });

        return { ok: true, stream };
    } catch (error) {
        const domError = error as DOMException;
        const name = domError?.name ?? "";

        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
            return {
                ok: false,
                error:
                    "Accesul la microfon a fost refuzat. Apasă pe iconița de blocare din bara de adrese și permite microfonul pentru acest site.",
                canRetry: true,
            };
        }

        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
            return {
                ok: false,
                error: "Nu am găsit un microfon conectat. Verifică dispozitivul audio.",
                canRetry: true,
            };
        }

        if (name === "NotReadableError" || name === "TrackStartError") {
            return {
                ok: false,
                error: "Microfonul este folosit de altă aplicație. Închide celelalte aplicații și încearcă din nou.",
                canRetry: true,
            };
        }

        return {
            ok: false,
            error: "Nu am putut accesa microfonul. Verifică permisiunile din browser.",
            canRetry: true,
        };
    }
}

export function releaseMicrophoneStream(stream: MediaStream | null | undefined) {
    stream?.getTracks().forEach((track) => track.stop());
}
