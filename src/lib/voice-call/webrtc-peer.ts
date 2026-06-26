const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

export class WebRtcVoicePeer {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteAudio: HTMLAudioElement | null = null;

    constructor(
        private readonly onIceCandidate: (candidate: RTCIceCandidateInit) => void
    ) {}

    async start(existingStream?: MediaStream) {
        this.localStream =
            existingStream ??
            (await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            }));

        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        for (const track of this.localStream.getTracks()) {
            this.pc.addTrack(track, this.localStream);
        }

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.onIceCandidate(event.candidate.toJSON());
            }
        };

        this.pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (!stream) return;
            if (!this.remoteAudio) {
                this.remoteAudio = new Audio();
                this.remoteAudio.autoplay = true;
            }
            this.remoteAudio.srcObject = stream;
        };
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.pc) throw new Error("Peer not started");
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return offer;
    }

    async createAnswer(): Promise<RTCSessionDescriptionInit> {
        if (!this.pc) throw new Error("Peer not started");
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    async applyRemoteDescription(description: RTCSessionDescriptionInit) {
        if (!this.pc) throw new Error("Peer not started");
        await this.pc.setRemoteDescription(description);
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.pc || !candidate) return;
        try {
            await this.pc.addIceCandidate(candidate);
        } catch {
            // ICE candidates can arrive late; ignore non-fatal errors.
        }
    }

    setMuted(muted: boolean) {
        this.localStream?.getAudioTracks().forEach((track) => {
            track.enabled = !muted;
        });
    }

    close() {
        this.pc?.close();
        this.pc = null;
        this.localStream?.getTracks().forEach((track) => track.stop());
        this.localStream = null;
        if (this.remoteAudio) {
            this.remoteAudio.srcObject = null;
            this.remoteAudio = null;
        }
    }
}
