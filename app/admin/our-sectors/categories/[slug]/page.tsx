import { redirect } from 'next/navigation';

export default function Page({ params }: { params: { slug: string } }) {
    redirect(`/admin/our-sectors/categories/${params.slug}/projects`);
}
