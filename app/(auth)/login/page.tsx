import { Suspense } from "react"
import Image from "next/image"

import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Image
            src="/logo-black.png"
            alt="Tijori"
            width={168}
            height={70}
            priority
            className="mx-auto h-8 w-auto dark:hidden"
          />
          <Image
            src="/logo-white.png"
            alt="Tijori"
            width={168}
            height={70}
            priority
            className="mx-auto hidden h-8 w-auto dark:block"
          />
          <p className="text-sm text-muted-foreground">Your personal inspiration library</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
