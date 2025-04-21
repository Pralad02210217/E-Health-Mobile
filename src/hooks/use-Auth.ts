
import { useQuery } from "@tanstack/react-query";
import { getUserSessionQueryFn } from "../api/api";

const useAuth = () => {
    const query = useQuery({
        queryKey: ["authUser"],
        queryFn: getUserSessionQueryFn,
    });

    const session = query.data?.data?.user; 

    const user = session ? { ...session, sessionId: query.data?.data?.id } : null;
    return { ...query, user };
};

export default useAuth;
