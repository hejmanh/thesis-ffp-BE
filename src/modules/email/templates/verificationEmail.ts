type VerificationEmailParams = {
  verificationLink: string;
  expiresText: string;
};

export const buildVerificationEmail = ({
  verificationLink,
  expiresText,
}: VerificationEmailParams) => {
  return `
            <div style="font-family: Arial, sans-serif; background: #f4f8ff; margin: 0; padding: 0;">
  
                <!-- Wrapper -->
                <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #4da3ff 0%, #1e6fe8 100%); padding: 36px 24px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 800; letter-spacing: 0.5px;">
                            Welcome to Retire Safely
                        </h1>
                    </div>

                    <!-- Card -->
                    <div style="background: #ffffff; padding: 36px 28px; border: 1px solid #e3edff; border-top: none; border-radius: 0 0 10px 10px;">
                    
                        <p style="font-size: 16px; color: #374151; margin: 0 0 16px; font-weight: 600;">
                            Hello,
                        </p>

                        <p style="font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 28px;">
                            Thanks for joining <strong style="color:#1e6fe8;">Retire Safely</strong>.  
                            Please confirm your email address to activate your account and get started.
                        </p>

                        <!-- CTA -->
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${verificationLink}"
                            style="background: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(59,130,246,0.25);">
                            Verify Email
                            </a>
                        </div>

                        <!-- Divider -->
                        <div style="border-top: 1px solid #e3edff; margin: 28px 0;"></div>

                        <!-- Security note -->
                        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0;">
                            <strong style="color:#374151;">Note:</strong>  
                            This link expires in <strong>${expiresText}</strong>.  
                            If you didn't create an account, you can safely ignore this email.
                        </p>

                        <!-- Fallback link -->
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; word-break: break-all;">
                            Or copy and paste this link into your browser:<br/>
                            ${verificationLink}
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; padding: 20px 10px;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                            © 2026 Retire Safely. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        `;
};
