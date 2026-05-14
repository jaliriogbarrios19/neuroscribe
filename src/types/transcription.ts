export interface TranscriptionSegment {
  speaker_id: string;
  speaker_label: string;
  text: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
}

export interface SpeakerInfo {
  id: string;
  label: string;
  color: string;
}

export interface TranscriptionResult {
  full_text: string;
  segments: TranscriptionSegment[];
  speakers: SpeakerInfo[];
}
