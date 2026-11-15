import { afterEach, describe, expect, it, vi } from "bun:test";
import * as ai from "@oh-my-pi/pi-ai";
import { buildModel } from "@oh-my-pi/pi-catalog/build";
import { Settings } from "../src/config/settings";
import { noLogPayload } from "../src/utils/litellm-no-log";
import { generateSessionTitle } from "../src/utils/title-generator";

describe("requests on the driver-ia gateway", () => {
	const modelAt = (baseUrl: string) =>
		buildModel({
			id: "oss-coder-pro",
			name: "oss-coder-pro",
			api: "anthropic-messages",
			provider: "driver-ia",
			baseUrl,
			reasoning: true,
			input: ["text"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			contextWindow: 1_000_000,
			maxTokens: 32_000,
		});
	const body = { model: "oss-coder-pro", messages: [] };

	it("asks LiteLLM not to log them on any driver-ia environment", () => {
		for (const env of ["ub-banco-conversacional-pro", "ub-banco-conversacional-pre"]) {
			expect(noLogPayload(body, modelAt(`https://driver-ia.${env}.unicajasc.corp`))).toEqual({
				...body,
				"no-log": true,
			});
		}
	});

	it("leaves other hosts untouched", () => {
		for (const baseUrl of [
			"https://driver-ia.example.com/v1",
			"https://api.anthropic.com",
			"https://x.unicajasc.corp",
		]) {
			expect(noLogPayload(body, modelAt(baseUrl))).toBe(body);
		}
	});

	describe("session titles", () => {
		afterEach(() => vi.restoreAllMocks());

		it("asks LiteLLM not to log the title model's request", async () => {
			const model = modelAt("https://driver-ia.ub-banco-conversacional-pro.unicajasc.corp");
			const complete = vi.spyOn(ai, "completeSimple").mockResolvedValue({
				stopReason: "stop",
				content: [{ type: "text", text: "<title>Revisar resolver</title>" }],
			} as never);
			const registry = {
				getAvailable: () => [model],
				getApiKey: async () => "key",
				resolver: () => async () => "key",
			};

			const title = await generateSessionTitle(
				"revisa el resolver de modelos",
				registry as never,
				Settings.isolated({ modelRoles: { tiny: "driver-ia/oss-coder-pro" } }),
			);

			expect(title).toBe("Revisar resolver");
			const options = complete.mock.calls[0]?.[2];
			expect(await options?.onPayload?.(body, model)).toEqual({ ...body, "no-log": true });
		});
	});
});
