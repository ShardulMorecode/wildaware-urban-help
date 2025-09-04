// Rule-based Wildlife Encounter Classifier
import { species, Species } from '@/data/wildlife-data';

export interface ClassificationResult {
  speciesGuess: 'snake' | 'monkey' | 'dog' | 'unknown';
  urgency: 'high' | 'medium' | 'low';
  intent: 'ask_guidance' | 'report_sighting' | 'call_help';
  confidence: number;
  reasoning: string[];
}

export const classifyWildlifeEncounter = (message: string): ClassificationResult => {
  const text = message.toLowerCase();
  const reasoning: string[] = [];
  
  // Intent detection
  let intent: ClassificationResult['intent'] = 'ask_guidance';
  
  if (text.includes('spotted') || text.includes('sighting') || text.includes('saw') || text.includes('found')) {
    intent = 'report_sighting';
    reasoning.push('Detected sighting keywords');
  } else if (text.includes('who to call') || text.includes('help me') || text.includes('emergency') || text.includes('rescue')) {
    intent = 'call_help';
    reasoning.push('Detected help request keywords');
  }

  // Urgency detection
  let urgency: ClassificationResult['urgency'] = 'low';
  
  const highUrgencyWords = ['bite', 'bitten', 'bleeding', 'attacked', 'child', 'trapped', 'inside room', 'house', 'bedroom', 'aggressive', 'charging'];
  const mediumUrgencyWords = ['close', 'near', 'approaching', 'following', 'won\'t leave', 'blocking'];
  
  if (highUrgencyWords.some(word => text.includes(word))) {
    urgency = 'high';
    reasoning.push('High urgency indicators detected');
  } else if (mediumUrgencyWords.some(word => text.includes(word))) {
    urgency = 'medium';
    reasoning.push('Medium urgency indicators detected');
  }

  // Species identification
  let speciesGuess: ClassificationResult['speciesGuess'] = 'unknown';
  let maxMatches = 0;
  
  for (const speciesData of species) {
    const matches = speciesData.keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      speciesGuess = speciesData.commonName.toLowerCase() as ClassificationResult['speciesGuess'];
      reasoning.push(`Identified as ${speciesData.commonName} based on keywords`);
    }
  }

  // Calculate confidence
  let confidence = 0.5; // Base confidence
  
  if (maxMatches > 0) confidence += 0.3;
  if (intent !== 'ask_guidance') confidence += 0.1;
  if (urgency === 'high') confidence += 0.1;
  
  confidence = Math.min(confidence, 1.0);

  return {
    speciesGuess,
    urgency,
    intent,
    confidence,
    reasoning
  };
};

export const getEmergencyKeywords = () => ({
  high: ['bite', 'bitten', 'bleeding', 'attacked', 'child', 'trapped', 'inside', 'aggressive'],
  medium: ['close', 'near', 'approaching', 'following', 'blocking'],
  species: {
    snake: ['snake', 'serpent', 'slither', 'coil', 'hiss', 'scales'],
    monkey: ['monkey', 'primate', 'macaque', 'ape', 'climbing'],
    dog: ['dog', 'canine', 'stray', 'bark', 'growl']
  }
});