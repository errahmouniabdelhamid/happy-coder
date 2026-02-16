/**
 * OpenCode CLI Entry Point
 * 
 * This module provides the main entry point for running the OpenCode agent
 * through Happy CLI. OpenCode is an open-source AI coding agent from
 * anomalyco/opencode that supports the Agent Client Protocol (ACP).
 * 
 * OpenCode uses the generic ACP backend since it's a standard ACP-compliant
 * agent, similar to how Gemini is handled.
 */

import { ApiClient } from '@/api/api';
import { logger } from '@/ui/logger';
import { Credentials, readSettings } from '@/persistence';
import { initialMachineMetadata } from '@/daemon/run';
import { connectionState } from '@/utils/serverConnectionErrors';
import { runAcp } from '@/agent/acp';

/**
 * Main entry point for the opencode command
 * 
 * @param opts - Configuration options
 * @param opts.credentials - User credentials for Happy API
 * @param opts.startedBy - How the session was initiated (daemon or terminal)
 * @param opts.verbose - Whether to print verbose ACP backend/envelope events
 */
export async function runOpencode(opts: {
  credentials: Credentials;
  startedBy?: 'daemon' | 'terminal';
  verbose?: boolean;
}): Promise<void> {
  logger.debug('[OpenCode] Starting OpenCode agent via ACP');
  
  // Set backend for offline warnings
  connectionState.setBackend('OpenCode');
  
  const api = await ApiClient.create(opts.credentials);
  
  // Get machine ID
  const settings = await readSettings();
  const machineId = settings?.machineId;
  if (!machineId) {
    console.error(`[OpenCode] No machine ID found in settings. Please report this issue.`);
    process.exit(1);
  }
  
  logger.debug(`[OpenCode] Using machineId: ${machineId}`);
  await api.getOrCreateMachine({
    machineId,
    metadata: initialMachineMetadata
  });
  
  // Use the generic ACP runner with opencode configuration
  // OpenCode is spawned with the 'acp' subcommand to enable ACP mode
  await runAcp({
    credentials: opts.credentials,
    startedBy: opts.startedBy,
    verbose: opts.verbose ?? false,
    agentName: 'opencode',
    command: 'opencode',
    args: ['acp'],
  });
}
