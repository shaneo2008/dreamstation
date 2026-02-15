import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import {
  AI_GENERATION_PRESETS,
  GENERATION_OPTIONS,
  DEFAULT_GENERATION_CONFIG,
  PROMPT_TEMPLATES,
  buildDynamicPrompt,
  validateGenerationConfig,
  buildN8nPayload
} from '../config/aiGenerationConfig';
import { aiScriptGeneration } from '../lib/aiScriptGeneration';
import { Wand2, Settings, FileText, Users, Palette, Volume2 } from 'lucide-react';

const AIGenerationForm = ({
  sourceUrl,
  storyId,
  userId,
  onGenerationStart,
  onGenerationComplete,
  onError
}) => {
  const [config, setConfig] = useState(DEFAULT_GENERATION_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Update config when preset changes
  useEffect(() => {
    if (config.preset !== 'CUSTOM') {
      const preset = AI_GENERATION_PRESETS[config.preset];
      if (preset) {
        setConfig(prev => ({
          ...prev,
          pacing: preset.pacing,
          emotionalIntensity: preset.emotionalIntensity,
          dialogueStyle: preset.dialogueStyle,
          narrationLevel: preset.narrationLevel
        }));
      }
    }
  }, [config.preset]);

  // Validate configuration on changes
  useEffect(() => {
    const validation = validateGenerationConfig(config);
    setValidationErrors(validation.errors);
  }, [config]);

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePreviewPrompt = () => {
    const prompt = buildDynamicPrompt(config);
    setPreviewPrompt(prompt);
  };

  const handleGenerate = async () => {
    const validation = validateGenerationConfig(config);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsGenerating(true);
    onGenerationStart?.(config);

    try {
      const payload = buildN8nPayload(config, sourceUrl, storyId, userId);

      const result = await aiScriptGeneration.generateScriptFromUrl({
        sourceUrl,
        storyId,
        userId,
        preferences: payload.preferences,
        aiPrompts: payload.ai_prompts,
        generationMetadata: payload.generation_metadata
      });

      onGenerationComplete?.(result);
    } catch (error) {
      console.error('AI generation failed:', error);
      onError?.(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Script Generation Configuration
          </CardTitle>
          <CardDescription>
            Shape how AI brings your child's story to life
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />
                Style
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="characters" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Characters
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Volume2 className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Basic Settings */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="preset">Generation Preset</Label>
                    <Select value={config.preset} onValueChange={(value) => updateConfig('preset', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AI_GENERATION_PRESETS).map(([key, preset]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{preset.name}</div>
                              <div className="text-sm text-muted-foreground">{preset.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      value={config.genre}
                      onChange={(e) => updateConfig('genre', e.target.value)}
                      placeholder="e.g., Drama, Comedy, Romance"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tone">Story Tone</Label>
                    <Input
                      id="tone"
                      value={config.tone}
                      onChange={(e) => updateConfig('tone', e.target.value)}
                      placeholder="e.g., Suspenseful, Light-hearted, Emotional"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Episode Count: {config.episodeCount}</Label>
                    <Slider
                      value={[config.episodeCount]}
                      onValueChange={([value]) => updateConfig('episodeCount', value)}
                      max={20}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Episode Duration: {config.episodeDuration} minutes</Label>
                    <Slider
                      value={[config.episodeDuration]}
                      onValueChange={([value]) => updateConfig('episodeDuration', value)}
                      max={60}
                      min={5}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contentGuidelines">Content Guidelines</Label>
                    <Select value={config.contentGuidelines} onValueChange={(value) => updateConfig('contentGuidelines', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.contentGuidelines).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Style Settings */}
            <TabsContent value="style" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pacing">Pacing Style</Label>
                    <Select value={config.pacing} onValueChange={(value) => updateConfig('pacing', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.pacing).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dialogueStyle">Dialogue Style</Label>
                    <Select value={config.dialogueStyle} onValueChange={(value) => updateConfig('dialogueStyle', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.dialogueStyle).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="emotionalIntensity">Emotional Intensity</Label>
                    <Select value={config.emotionalIntensity} onValueChange={(value) => updateConfig('emotionalIntensity', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.emotionalIntensity).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="narrationLevel">Narration Level</Label>
                    <Select value={config.narrationLevel} onValueChange={(value) => updateConfig('narrationLevel', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.narrationLevel).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="productionStyle">Production Style</Label>
                    <Select value={config.productionStyle} onValueChange={(value) => updateConfig('productionStyle', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.productionStyle).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Structure Settings */}
            <TabsContent value="structure" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="episodeStructure">Episode Structure</Label>
                    <Select value={config.episodeStructure} onValueChange={(value) => updateConfig('episodeStructure', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.episodeStructure).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="narrativePerspective">Narrative Perspective</Label>
                    <Input
                      id="narrativePerspective"
                      value={config.narrativePerspective}
                      onChange={(e) => updateConfig('narrativePerspective', e.target.value)}
                      placeholder="e.g., Third-Person Limited, First-Person"
                    />
                  </div>

                  <div>
                    <Label htmlFor="characterFocus">Character Focus</Label>
                    <Select value={config.characterFocus} onValueChange={(value) => updateConfig('characterFocus', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GENERATION_OPTIONS.characterFocus).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeCliffhangers"
                      checked={config.includeCliffhangers}
                      onCheckedChange={(checked) => updateConfig('includeCliffhangers', checked)}
                    />
                    <Label htmlFor="includeCliffhangers">Include Cliffhangers</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeTwist"
                      checked={config.includeTwist}
                      onCheckedChange={(checked) => updateConfig('includeTwist', checked)}
                    />
                    <Label htmlFor="includeTwist">Include Plot Twists</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="resolvePlotlines"
                      checked={config.resolvePlotlines}
                      onCheckedChange={(checked) => updateConfig('resolvePlotlines', checked)}
                    />
                    <Label htmlFor="resolvePlotlines">Resolve All Plotlines</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Character Settings */}
            <TabsContent value="characters" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="characterVoiceNotes">Character Voice Notes</Label>
                  <Textarea
                    id="characterVoiceNotes"
                    value={config.characterVoiceNotes}
                    onChange={(e) => updateConfig('characterVoiceNotes', e.target.value)}
                    placeholder="Specific instructions for character voices, accents, or speaking styles..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customPromptAdditions">Custom Prompt Additions</Label>
                  <Textarea
                    id="customPromptAdditions"
                    value={config.customPromptAdditions}
                    onChange={(e) => updateConfig('customPromptAdditions', e.target.value)}
                    placeholder="Additional instructions for the AI system..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    value={config.specialInstructions}
                    onChange={(e) => updateConfig('specialInstructions', e.target.value)}
                    placeholder="Any special requirements or considerations..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeStageDirections"
                      checked={config.includeStageDirections}
                      onCheckedChange={(checked) => updateConfig('includeStageDirections', checked)}
                    />
                    <Label htmlFor="includeStageDirections">Stage Directions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeEmotionCues"
                      checked={config.includeEmotionCues}
                      onCheckedChange={(checked) => updateConfig('includeEmotionCues', checked)}
                    />
                    <Label htmlFor="includeEmotionCues">Emotion Cues</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includePacingNotes"
                      checked={config.includePacingNotes}
                      onCheckedChange={(checked) => updateConfig('includePacingNotes', checked)}
                    />
                    <Label htmlFor="includePacingNotes">Pacing Notes</Label>
                  </div>
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={handlePreviewPrompt}
                    className="w-full"
                  >
                    Preview AI Prompt
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Configuration Issues:</h4>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || validationErrors.length > 0}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate AI Script
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Preview Modal */}
      {previewPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>AI Prompt Preview</CardTitle>
            <CardDescription>
              This is how your configuration will be sent to the AI system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-medium">System Prompt:</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                {previewPrompt.systemPrompt}
              </div>
            </div>
            <div>
              <Label className="font-medium">Conversion Instructions:</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                {previewPrompt.conversionInstructions}
              </div>
            </div>
            <div>
              <Label className="font-medium">Character Analysis:</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                {previewPrompt.characterAnalysis}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setPreviewPrompt(null)}
              className="w-full"
            >
              Close Preview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIGenerationForm;
