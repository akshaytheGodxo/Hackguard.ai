import { getSession } from "@/lib/auth/session"
import { getProblemWithTestcase } from "@/lib/actions";
export default async function Page({params} : {params : Promise<{id: string}>}) {
    const {id} = await params;
    
    const problem = await getProblemWithTestcase(id);
    console.log(problem);
    return (
        <section> 

        
        </section>
    )
}