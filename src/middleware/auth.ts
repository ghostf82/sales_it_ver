import type { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase.js";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "missing_or_invalid_authorization_header"
      });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "missing_token"
      });
    }

    // Verify JWT token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: "invalid_or_expired_token"
      });
    }

    // Attach user to request
    (req as any).user = data.user;
    (req as any).token = token;
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      error: "authentication_failed"
    });
  }
}