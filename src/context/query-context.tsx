
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Props {
    children: ReactNode;
}


const queryClient = new QueryClient({

    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});


export default function QueryProvider ({ children}: Props){
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* Optional: Add Devtools for debugging in development */}
            {/* process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
    );
}