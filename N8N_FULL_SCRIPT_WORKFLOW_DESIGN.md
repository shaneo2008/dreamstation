# n8n Full Script TTS Workflow Design

## 🎯 **Workflow Overview**
Based on the successful line preview workflow, this workflow processes entire scripts to generate complete audio productions with precise timing metadata.

## 📋 **Workflow Nodes**

### **1. Webhook Trigger**
- **Path**: `/full-script-tts`
- **Method**: POST
- **Purpose**: Receives script data from frontend

### **2. Validate & Process Script Input**
- **Function**: Validates script data, generates production ID
- **Input**: Script lines, user settings, voice assignments
- **Output**: Validated metadata, production context

### **3. Create Production Record**
- **Function**: Creates initial database record
- **Database**: Insert into `audio_productions` table
- **Status**: 'processing', progress: 0

### **4. Split Script Lines**
- **Function**: Converts script into individual line items
- **Purpose**: Enables parallel processing of lines
- **Output**: Array of line objects with voice/emotion settings

### **5. Process Line for TTS (Loop)**
- **Function**: Prepares individual line for Cartesia API
- **Parallel**: Processes multiple lines simultaneously
- **Output**: Cartesia payload, S3 keys, metadata

### **6. Cartesia TTS Line Generation (Loop)**
- **API**: Cartesia TTS Bytes endpoint
- **Input**: Text, voice ID, emotion, format settings
- **Output**: WAV audio binary data

### **7. Upload Line Audio to S3 (Loop)**
- **Service**: AWS S3
- **Bucket**: `fancast-tts-previews`
- **Path**: `productions/{production_id}/lines/{filename}.wav`

### **8. Store Line Audio Data (Loop)**
- **Database**: Insert into `audio_production_lines` table
- **Data**: S3 URLs, durations, voice settings, timing

### **9. Collect All Line Results**
- **Function**: Waits for all lines to complete
- **Purpose**: Aggregates results, calculates timing metadata
- **Output**: Complete timing JSON for audio player

### **10. Update Production with Timing**
- **Database**: Update `audio_productions` table
- **Data**: Final timing metadata, total duration, completion status
- **Status**: 'completed', progress: 100

### **11. Generate Final Response**
- **Function**: Creates success response for frontend
- **Output**: Production ID, timing metadata, audio URLs

### **12. Error Handler**
- **Function**: Handles workflow failures
- **Purpose**: Updates production status, returns error response

## 🔄 **Data Flow**

```
Frontend Request
    ↓
Validate Input → Create Production Record
    ↓
Split Lines → [Process Line → Cartesia TTS → S3 Upload → Store Data] (Parallel)
    ↓
Collect Results → Update Production → Final Response
    ↓
Frontend Response
```

## 📊 **Database Integration**

### **Production Tracking**
- `audio_productions`: Main production record
- `audio_production_lines`: Individual line audio data
- `voice_assignments`: Character voice mappings

### **Progress Updates**
- Real-time progress calculation
- Status tracking (pending → processing → completed)
- Error handling and retry logic

## 🎵 **Timing Metadata Format**

```json
{
  "total_duration": 138.5,
  "lines": [
    {
      "line_id": "uuid",
      "start_time": 0.0,
      "end_time": 3.2,
      "duration": 3.2,
      "speaker": "narrator",
      "text": "Line content...",
      "voice_used": "voice_id",
      "emotion_applied": "neutral"
    }
  ],
  "metadata": {
    "total_lines": 15,
    "speakers": ["narrator", "protagonist"],
    "generated_at": "2025-01-06T22:47:00Z"
  }
}
```

## 🚀 **Key Features**

### **Parallel Processing**
- Multiple lines processed simultaneously
- Faster generation for long scripts
- Efficient resource utilization

### **Error Recovery**
- Individual line failure handling
- Production status updates
- Retry mechanisms

### **Quality Assurance**
- Audio quality scoring
- Regeneration flags
- Validation at each step

### **Performance Optimization**
- Batch database operations
- Efficient S3 uploads
- Minimal API calls

## 🔧 **Environment Variables Required**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
CARTESIA_API_KEY=your_cartesia_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

## 📱 **Frontend Integration**

### **Request Format**
```json
{
  "user_id": "uuid",
  "script_id": "uuid", 
  "title": "Production Title",
  "script_data": {
    "script_lines": [...]
  },
  "voice_settings": {
    "narrator": {"voice_id": "...", "emotion": "neutral"}
  },
  "generation_settings": {
    "audio_format": "wav",
    "quality": "high"
  }
}
```

### **Response Format**
```json
{
  "success": true,
  "data": {
    "production_id": "uuid",
    "status": "completed",
    "timing_metadata": {...},
    "audio_duration": 138.5
  }
}
```

## 🎯 **Next Steps**

1. **Create workflow in n8n cloud**
2. **Configure Cartesia and Supabase credentials**
3. **Test with sample script data**
4. **Integrate with frontend service**
5. **Add progress tracking UI**

This workflow design provides the complete architecture for Phase 2B implementation.
