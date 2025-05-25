import React, { useEffect, useState } from 'react';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';

interface MiniAppProps {
    isMiniApp: boolean;
}

export async function getServerSideProps(
    context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<MiniAppProps>> {
    const { query, resolvedUrl } = context;
    const isMiniApp =
        (resolvedUrl && resolvedUrl.startsWith('/mini')) ||
        query.miniApp === 'true';
    // ...branch SSR logic as needed...
    return { props: { isMiniApp } };
}

const SomePage = ({ isMiniApp: initialIsMiniApp }: MiniAppProps) => {
    const [isMiniApp, setIsMiniApp] = useState(initialIsMiniApp);
    const [miniAppError, setMiniAppError] = useState<any>(null);

    useEffect(() => {
        const { isMiniApp, error } = tryDetectMiniAppClient();
        setIsMiniApp(isMiniApp);
        setMiniAppError(error);
    }, []);

    return (
        <div>
            {isMiniApp && <MiniAppBanner />}
            {miniAppError && <div style={{ color: 'red' }}>Mini App detection error: {miniAppError.message || String(miniAppError)}</div>}
            <h1>Some Page</h1>
            <p>Mini App Mode: {isMiniApp ? 'Yes' : 'No'}</p>
        </div>
    );
};

export default SomePage;
