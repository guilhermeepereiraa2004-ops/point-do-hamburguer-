import { betterAuth, type BetterAuthOptions } from "better-auth";
import { username } from "better-auth/plugins";

export function authOptions(database: BetterAuthOptions["database"], secret: string, options: { provision?: boolean; baseURL?: string; trustedOrigins?: string[] } = {}): BetterAuthOptions {
  return {
    appName: "Point do Hambúrguer",
    database, secret, baseURL: options.baseURL,
    trustedOrigins: options.trustedOrigins,
    emailAndPassword: { enabled: true, disableSignUp: !options.provision, autoSignIn: false, minPasswordLength: 12, maxPasswordLength: 128 },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30, cookieCache: { enabled: false }, modelName: "auth_session" },
    user: { modelName: "auth_user" }, account: { modelName: "auth_account" }, verification: { modelName: "auth_verification" },
    rateLimit: { enabled: true, storage: "database", modelName: "auth_rate_limit", window: 60, max: 60,
      customRules: { "/sign-in/username": { window: 60, max: 5 }, "/change-password": { window: 60, max: 5 } } },
    plugins: [username({ minUsernameLength: 3, maxUsernameLength: 40 })],
  };
}
export function createAuth(database: BetterAuthOptions["database"], secret: string, options?: Parameters<typeof authOptions>[2]) {
  return betterAuth({ ...authOptions(database, secret, options), plugins: [username({ minUsernameLength: 3, maxUsernameLength: 40 })] });
}
