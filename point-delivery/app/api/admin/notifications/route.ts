import { getAdminIdentity } from "@/actions/admin";
import { getStore } from "@/db";
import { listPushDevices, pushDeviceId, removePushDevice, removePushTarget, renamePushDevice, savePushTarget } from "@/db/push";
import { pushDeviceLabel, validatePushDeviceName, validatePushTarget } from "@/domain/push";
import { getPushConfig, sendPushTest } from "@/lib/order-push";
import { hasValidRequestOrigin } from "@/lib/request-origin";

const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  try {
    const identity = await getAdminIdentity();
    if (!identity || identity.mustChangePassword) return Response.json({ error: "Acesso restrito." }, { status: 403, headers });
    const devices = await listPushDevices(getStore(), identity.user.id);
    return Response.json({ publicKey: getPushConfig()?.publicKey ?? null, devices }, { headers });
  } catch {
    return Response.json({ error: "Não foi possível configurar as notificações agora." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getAdminIdentity();
    if (!identity || identity.mustChangePassword) return Response.json({ error: "Acesso restrito." }, { status: 403, headers });
    if (!hasValidRequestOrigin(request, { allowMissing: false })) return Response.json({ error: "Origem inválida." }, { status: 403, headers });
    if (Number(request.headers.get("content-length") || 0) > 10000) return Response.json({ error: "Inscrição muito grande." }, { status: 413, headers });
    const input = await request.json() as Record<string, unknown>;
    const db = getStore();
    if (input.kind === "remove-device" || input.kind === "rename-device") {
      if (typeof input.id !== "string" || !/^[a-f0-9]{64}$/.test(input.id)) {
        return Response.json({ error: "Aparelho inválido." }, { status: 400, headers });
      }
      if (input.kind === "rename-device") {
        let name: string;
        try { name = validatePushDeviceName(input.name); }
        catch { return Response.json({ error: "Informe um nome de 1 a 60 caracteres para o aparelho." }, { status: 400, headers }); }
        if (!await renamePushDevice(db, identity.user.id, input.id, name)) {
          return Response.json({ error: "Aparelho não encontrado. Atualize a lista." }, { status: 404, headers });
        }
        return Response.json({ ok: true, name }, { headers });
      }
      await removePushDevice(db, identity.user.id, input.id);
      return Response.json({ ok: true }, { headers });
    }
    if (input.kind === "enable") {
      if (!getPushConfig()) return Response.json({ error: "Notificações ainda não configuradas." }, { status: 503, headers });
      const target = validatePushTarget(input.subscription);
      const deviceId = await savePushTarget(db, identity.user.id, target, pushDeviceLabel(request.headers.get("user-agent") || ""));
      return Response.json({ ok: true, deviceId, devices: await listPushDevices(db, identity.user.id) }, { headers });
    }
    if (typeof input.endpoint !== "string" || input.endpoint.length > 4096) {
      return Response.json({ error: "Inscrição inválida." }, { status: 400, headers });
    }
    if (input.kind === "status") {
      const deviceId = await pushDeviceId(db, identity.user.id, input.endpoint);
      return Response.json({ enabled: deviceId !== null, deviceId }, { headers });
    }
    if (input.kind === "disable") {
      await removePushTarget(db, identity.user.id, input.endpoint);
      return Response.json({ ok: true }, { headers });
    }
    if (input.kind === "test") {
      await sendPushTest(identity.user.id, input.endpoint);
      return Response.json({ ok: true }, { headers });
    }
    return Response.json({ error: "Operação inválida." }, { status: 400, headers });
  } catch {
    return Response.json({ error: "Não foi possível salvar as notificações. Tente novamente." }, { status: 400, headers });
  }
}
