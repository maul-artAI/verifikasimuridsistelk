<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('X-XSS-Protection', '0'); // modern browsers rely on CSP

        // HSTS only if https
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // CSP : ketat untuk Inertia + Vite; di local izinkan vite dev server 5173 (HMR)
        $isLocal = app()->environment('local');
        $viteDev = $isLocal ? ' http://127.0.0.1:5173 http://localhost:5173 ws://127.0.0.1:5173 ws://localhost:5173' : '';
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.bunny.net blob:" . $viteDev,
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net" . $viteDev,
            "font-src 'self' https://fonts.bunny.net data:",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://fonts.bunny.net" . $viteDev . " ws:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }
}
