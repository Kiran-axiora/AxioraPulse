import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

export default function VerifyEmail() {

    const [params] = useSearchParams();

    const nav = useNavigate();

    useEffect(() => {

        const verify = async () => {

            try {

                const token = params.get("token");

                await API.get(
                    `/auth/verify-email?token=${token}`
                );

                toast.success(
                    "Email verified successfully"
                );

                nav("/login");

            } catch (err) {

                toast.error(
                    "Invalid or expired verification link"
                );
            }
        };

        verify();

    }, []);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#F8F5EE",
                fontFamily: "sans-serif"
            }}
        >
            Verifying email...
        </div>
    );
}