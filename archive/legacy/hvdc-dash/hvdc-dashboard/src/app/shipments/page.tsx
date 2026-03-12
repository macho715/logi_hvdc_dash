import MobileShipmentList from '@/components/MobileShipmentList'
import ShipmentList from '@/components/ShipmentList'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function ShipmentsPage() {
    return (
        <>
            <div className="lg:hidden">
                <MobileShipmentList />
            </div>
            <div className="hidden lg:block">
                <DashboardLayout>
                    <ShipmentList />
                </DashboardLayout>
            </div>
        </>
    )
}
